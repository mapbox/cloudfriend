'use strict';

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const test = require('tape');
const cf = require('..');
const fixtures = require('./fixtures/shortcuts');
const util = require('util');
const sleep = util.promisify(setTimeout);

const update = !!process.env.UPDATE;

const noUndefined = (template) => JSON.parse(JSON.stringify(template));

test('[shortcuts] fixture validation', async (assert) => {
  // Runs cfn-lint, ignoring "warnings". Install via pip or Homebrew to run these
  // tests locally.
  const cfnLint = (filepath) => new Promise((resolve, reject) => {
    cp.exec(`cfn-lint ${filepath} --ignore-checks W`, (err, stdout) => {
      if (err) return reject(new Error(stdout));
      return resolve();
    });
  });

  const toValidate = fs
    .readdirSync(path.join(__dirname, 'fixtures', 'shortcuts'))
    .filter((filename) => path.extname(filename) === '.json');

  while (toValidate.length) {
    const filename = toValidate.shift();
    await Promise.all([
      cfnLint(path.join(__dirname, 'fixtures', 'shortcuts', filename))
        .then(() => assert.pass(`${filename} fixture passed validation`))
        .catch((err) => {
          assert.fail(`${filename} fixture fails validation`);
          console.log(err.message);
        }),
      sleep(1000)
    ]);
  }

  assert.end();
});

test('[shortcuts] lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.Lambda(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.Lambda({}),
    /You must provide a LogicalName, and Code/,
    'throws without required parameters'
  );

  assert.throws(
    () => new cf.shortcuts.Lambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      RoleArn: 'custom',
      Statement: [{
        Effect: 'Allow',
        Action: 's3:GetObject',
        Resource: 'arn:aws:s3:::my-bucket/*'
      }]
    }),
    /You cannot specify both Statements and a RoleArn/,
    'throws for RoleArn and Statements both provided'
  );

  let lambda = new cf.shortcuts.Lambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    }
  });

  let template = cf.merge(lambda);
  if (update) fixtures.update('lambda-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('lambda-defaults'),
    'expected resources generated using all default values'
  );

  lambda = new cf.shortcuts.Lambda({
    LogicalName: 'MyLambda',
    Code: {
      ImageUri: 'MyImage'
    }
  });

  template = cf.merge(lambda);
  if (update) fixtures.update('lambda-docker', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('lambda-docker'),
    'expected resources generated using all default values and a docker image'
  );

  lambda = new cf.shortcuts.Lambda({
    LogicalName: 'MyLambda',
    Code: {
      ZipFile: 'fake code'
    }
  });

  template = cf.merge(lambda);
  if (update) fixtures.update('lambda-zipfile', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('lambda-zipfile'),
    'expected resources generated using all default values and inline code'
  );

  lambda = new cf.shortcuts.Lambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    RoleArn: cf.getAtt('CustomLambdaRole', 'Arn')
  });

  template = cf.merge(lambda, {
    Resources: {
      'CustomLambdaRole': {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {}
        }
      }
    }
  });
  if (update) fixtures.update('lambda-provided-role', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('lambda-provided-role'),
    'expected resources generated if RoleArn provided'
  );

  lambda = new cf.shortcuts.Lambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    DeadLetterConfig: {
      TargetArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake'
    },
    Description: 'my description',
    Environment: { Variables: { MyCoolEnv: 'a' } },
    FunctionName: 'my-function',
    Handler: 'index.something',
    KmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/fake',
    Layers: ['arn:aws:lambda:us-east-2:590474943231:layer:AWS-Parameters-and-Secrets-Lambda-Extension:4'],
    MemorySize: 512,
    ReservedConcurrentExecutions: 10,
    Runtime: 'nodejs22.x',
    Tags: [{ Key: 'a', Value: 'b' }],
    Timeout: 30,
    TracingConfig: { Mode: 'Active' },
    VpcConfig: {
      SecurityGroupIds: ['sg-12345678'],
      SubnetIds: ['fake']
    },
    Condition: 'Always',
    DependsOn: 'AnotherThing',
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:GetObject',
        Resource: 'arn:aws:s3:::fake/data'
      }
    ],
    AlarmName: 'my-alarm',
    AlarmDescription: 'some alarm',
    AlarmActions: ['devnull@mapbox.com'],
    Period: 120,
    EvaluationPeriods: 2,
    Statistic: 'Minimum',
    Threshold: 10,
    ComparisonOperator: 'LessThanThreshold',
    TreatMissingData: 'breaching',
    EvaluateLowSampleCountPercentile: 'ignore',
    ExtendedStatistics: 'p100',
    OKActions: ['devnull@mapbox.com'],
    LogRetentionInDays: 30
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    lambda
  );
  if (update) fixtures.update('lambda-full', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('lambda-full'),
    'expected resources generated using no default values'
  );

  assert.end();
});

test('[shortcuts] queue-lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.QueueLambda(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.QueueLambda({}),
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.QueueLambda({
        LogicalName: 'MyLambda',
        Code: {
          S3Bucket: 'my-code-bucket',
          S3Key: 'path/to/code.zip'
        }
      }),
    /You must provide an EventSourceArn and ReservedConcurrentExecutions/,
    'throws without queue-lambda required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.QueueLambda({
        LogicalName: 'MyLambda',
        Code: {
          S3Bucket: 'my-code-bucket',
          S3Key: 'path/to/code.zip'
        },
        EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake',
        ReservedConcurrentExecutions: -1
      }),
    /ReservedConcurrentExecutions must be greater than or equal to 0/,
    'throws when ReservedConcurrentExecutions is a negative number'
  );

  const zeroLambda = new cf.shortcuts.QueueLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake',
    ReservedConcurrentExecutions: 0
  });
  const zeroTemplate = cf.merge(zeroLambda);
  if (update) fixtures.update('queue-lambda-zero', zeroTemplate);
  assert.deepEqual(
    noUndefined(zeroTemplate),
    fixtures.get('queue-lambda-zero'),
    'expected resources generated'
  );

  const lambda = new cf.shortcuts.QueueLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake',
    ReservedConcurrentExecutions: 10
  });

  const template = cf.merge(lambda);
  if (update) fixtures.update('queue-lambda', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-lambda'),
    'expected resources generated'
  );

  assert.end();
});

test('[shortcuts] scheduled-lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.ScheduledLambda(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.ScheduledLambda({}),
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.ScheduledLambda({
        LogicalName: 'MyLambda',
        Code: {
          S3Bucket: 'my-code-bucket',
          S3Key: 'path/to/code.zip'
        }
      }),
    /You must provide a ScheduleExpression/,
    'throws without scheduled-lambda required parameters'
  );

  let lambda = new cf.shortcuts.ScheduledLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    ScheduleExpression: 'rate(1 hour)'
  });

  let template = cf.merge(lambda);
  if (update) fixtures.update('scheduled-lambda-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('scheduled-lambda-defaults'),
    'expected resources generated with defaults'
  );

  lambda = new cf.shortcuts.ScheduledLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    ScheduleRoleArn: 'arn:aws:iam::012345678901:role/MyCoolRole',
    ScheduleGroupName: 'my-cool-stack',
    ScheduleExpression: 'rate(1 hour)',
    State: 'DISABLED'
  });

  template = cf.merge(lambda);
  if (update) fixtures.update('scheduled-lambda-full', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('scheduled-lambda-full'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] event-lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.EventLambda(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.EventLambda({}),
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.EventLambda({
        LogicalName: 'MyLambda',
        Code: {
          S3Bucket: 'my-code-bucket',
          S3Key: 'path/to/code.zip'
        }
      }),
    /You must provide an EventPattern/,
    'throws without event-lambda required parameters'
  );

  let lambda = new cf.shortcuts.EventLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventPattern: {
      source: ['aws.ec2'],
      'detail-type': ['EC2 Instance State-change Notification'],
      detail: {
        state: ['running']
      }
    }
  });

  let template = cf.merge(lambda);
  if (update) fixtures.update('event-lambda-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('event-lambda-defaults'),
    'expected resources generated with defaults'
  );

  lambda = new cf.shortcuts.EventLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventPattern: {
      source: ['aws.ec2'],
      'detail-type': ['EC2 Instance State-change Notification'],
      detail: {
        state: ['running']
      }
    },
    State: 'DISABLED'
  });

  template = cf.merge(lambda);
  if (update) fixtures.update('event-lambda-full', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('event-lambda-full'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] stream-lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.StreamLambda(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.StreamLambda({}),
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.StreamLambda({
        LogicalName: 'MyLambda',
        Code: {
          S3Bucket: 'my-code-bucket',
          S3Key: 'path/to/code.zip'
        }
      }),
    /You must provide an EventSourceArn/,
    'throws without stream-lambda required parameters'
  );

  let lambda = new cf.shortcuts.StreamLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake'
  });

  let template = cf.merge(lambda);
  if (update) fixtures.update('stream-lambda-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('stream-lambda-defaults'),
    'expected resources generated via defaults'
  );

  lambda = new cf.shortcuts.StreamLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
    FilterCriteria: {
      Filters: [
        {
          Pattern: JSON.stringify({ eventName: ['INSERT', 'MODIFY'] })
        }
      ]
    },
    BatchSize: 10000,
    MaximumBatchingWindowInSeconds: 300,
    Enabled: false,
    StartingPosition: 'TRIM_HORIZON'
  });

  template = cf.merge(lambda);
  if (update) fixtures.update('stream-lambda-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('stream-lambda-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] StreamLambda FilterCriteria', (assert) => {
  assert.throws(
    () => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: ['test']
    }),
    '`FilterCriteria` must be a JSON-like object',
  );
  assert.throws(
    () => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: {}
    }),
    '`FilterCriteria` must contain property `Filter` of type array',
  );
  assert.throws(
    () => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: {
        Filter: 613
      }
    }),
    '`FilterCriteria` must contain property `Filter` of type array',
  );
  assert.throws(
    () => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: {
        Filters: [
          {
            NotPattern: JSON.stringify({ eventName: ['INSERT', 'MODIFY'] })
          },
          {
            Pattern: JSON.stringify({ eventName: ['INSERT', 'MODIFY'] })
          }
        ]
      }
    }),
    'An object in `FilterCriteria.Filter` was missing the required property `Pattern`',
  );
  assert.throws(
    () => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: {
        Filters: [
          {
            Pattern: '{"eventName":["INSERT","MODIFY"]}'
          },
          {
            Pattern: { eventName: ['INSERT', 'MODIFY'] }
          }
        ]
      }
    }),
    'An object in `FilterCriteria.Filter` contains a `Pattern` property that is not a JSON parseable string',
  );
  assert.end();
});

test('[shortcuts] log-subscription-lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.LogSubscriptionLambda(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.LogSubscriptionLambda({}),
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.LogSubscriptionLambda({
        LogicalName: 'MyLambda',
        Code: {
          S3Bucket: 'my-code-bucket',
          S3Key: 'path/to/code.zip'
        }
      }),
    /You must provide a LogGroupName/,
    'throws without log-subscription-lambda required parameters'
  );

  let lambda = new cf.shortcuts.LogSubscriptionLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    LogGroupName: 'my-log-group'
  });

  let template = cf.merge(lambda);
  if (update) fixtures.update('log-subscription-lambda-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('log-subscription-lambda-defaults'),
    'expected resources generated via defaults'
  );

  lambda = new cf.shortcuts.LogSubscriptionLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    FilterPattern: '{ $.errorCode = 400 }',
    LogGroupName: 'my-log-group'
  });

  template = cf.merge(lambda);
  if (update) fixtures.update('log-subscription-lambda-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('log-subscription-lambda-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] queue', (assert) => {
  assert.throws(
    () => new cf.shortcuts.Queue(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.Queue({}),
    /You must provide a LogicalName/,
    'throws without required parameters'
  );

  let queue = new cf.shortcuts.Queue({
    LogicalName: 'MyQueue'
  });

  let template = cf.merge(queue);
  if (update) fixtures.update('queue-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-defaults'),
    'expected resources generated for full defaults'
  );

  queue = new cf.shortcuts.Queue({
    LogicalName: 'MyQueue',
    VisibilityTimeout: 60,
    maxReceiveCount: 100,
    DelaySeconds: 60,
    KmsMasterKeyId: 'alias/my-key',
    KmsDataKeyReusePeriondSeconds: 86400,
    MaximumMessageSize: 1024,
    MessageRetentionPeriod: 60,
    QueueName: 'my-queue',
    ReceiveMessageWaitTimeSeconds: 20,
    Condition: 'Always',
    DependsOn: 'AnotherThing',
    TopicName: 'my-topic',
    DisplayName: 'topic-display-name',
    DeadLetterVisibilityTimeout: 60
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    queue
  );
  if (update) fixtures.update('queue-full', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-full'),
    'expected resources generated no defaults'
  );

  queue = new cf.shortcuts.Queue({
    LogicalName: 'MyQueue',
    ExistingTopicArn: 'arn:aws:sns:us-east-1:111122223333:MyTopic'
  });
  template = cf.merge(queue);
  if (update) fixtures.update('queue-external-topic', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-external-topic'),
    'expected resources generated for external topic'
  );

  queue = new cf.shortcuts.Queue({
    LogicalName: 'MyQueue',
    ExistingTopicArn: { Ref: 'TopicForOtherThing' }
  });
  template = cf.merge(
    { Resources: { TopicForOtherThing: { Type: 'AWS::SNS::Topic' } } },
    queue
  );
  if (update) fixtures.update('queue-external-topic-ref', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-external-topic-ref'),
    'expected resources generated for external topic identified by ref'
  );

  queue = new cf.shortcuts.Queue({
    LogicalName: 'MyFifoQueue',
    FifoQueue: true
  });
  template = cf.merge(queue);
  if (update) fixtures.update('queue-fifo', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-fifo'),
    'expected resources generated for FIFO queue'
  );

  queue = new cf.shortcuts.Queue({
    LogicalName: 'MyFifoQueue',
    QueueName: 'custom-and-fancy',
    FifoQueue: true
  });
  template = cf.merge(queue);
  if (update) fixtures.update('queue-fifo-queuename', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-fifo-queuename'),
    'expected resources generated for FIFO queue with specified QueueName'
  );

  queue = new cf.shortcuts.Queue({
    LogicalName: 'MyFifoFalseQueue',
    FifoQueue: false
  });
  template = cf.merge(queue);
  assert.equal(
    template.Resources.MyFifoFalseQueue.Properties.FifoQueue,
    undefined,
    'the FifoQueue value false is converted to undefined, to pass CFN validation'
  );

  assert.end();
});

test('[shortcuts] s3 kinesis firehose', (assert) => {
  assert.throws(
    () => new cf.shortcuts.S3KinesisFirehose(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.S3KinesisFirehose({}),
    /You must provide a LogicalName/,
    'throws without required LogicalName parameter'
  );

  assert.throws(
    () => new cf.shortcuts.S3KinesisFirehose({
      LogicalName: 'MyKinesisFirehose'
    }),
    /You must provide a DestinationBucket/,
    'throws without required DestinationBucket parameter'
  );

  let firehose = new cf.shortcuts.S3KinesisFirehose({
    LogicalName: 'MyKinesisFirehose',
    DestinationBucket: 'mah-bukkit'
  });

  let template = cf.merge(firehose);
  if (update) fixtures.update('firehose-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('firehose-defaults'),
    'expected resources generated for full defaults'
  );

  firehose = new cf.shortcuts.S3KinesisFirehose({
    LogicalName: 'MyKinesisFirehose',
    DestinationBucket: 'mah-bukkit',
    KinesisStreamARN: 'arn:aws:kinesis:us-east-1:111122223333:stream/my-stream'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    firehose
  );
  if (update) fixtures.update('firehose-with-stream', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('firehose-with-stream'),
    'expected resources generated with stream'
  );

  assert.end();
});

test('[shortcuts] role', (assert) => {
  assert.throws(
    () => new cf.shortcuts.Role(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.Role({}),
    /You must provide a LogicalName and AssumeRolePrincipals/,
    'throws without required parameters'
  );

  let role = new cf.shortcuts.Role({
    LogicalName: 'MyRole',
    AssumeRolePrincipals: [{ Service: 'ec2.amazonaws.com' }]
  });

  let template = cf.merge(role);
  if (update) fixtures.update('role-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('role-defaults'),
    'expected resources generated with defaults'
  );

  role = new cf.shortcuts.Role({
    LogicalName: 'MyRole',
    AssumeRolePrincipals: [{ Service: 'ec2.amazonaws.com' }],
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:GetObject',
        Resource: 'arn:aws:s3:::fake/data'
      }
    ],
    ManagedPolicyArns: ['arn:aws:iam::123456789012:policy/fake'],
    MaxSessionDuration: 3600,
    Path: '/fake/',
    RoleName: 'my-role',
    Tags: [{ Key: 'pipeline-name', Value: 'test' }],
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    role
  );
  if (update) fixtures.update('role-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('role-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] cross-account role', (assert) => {
  assert.throws(
    () => new cf.shortcuts.CrossAccountRole(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.CrossAccountRole({}),
    /You must provide a LogicalName and Accounts/,
    'throws without required parameters'
  );

  let role = new cf.shortcuts.CrossAccountRole({
    LogicalName: 'MyRole',
    Accounts: [
      '123456789012',
      'arn:aws:iam::123456789012:root',
      { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' }
    ]
  });

  let template = cf.merge(role);
  if (update) fixtures.update('cross-account-role-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('cross-account-role-defaults'),
    'expected resources generated with defaults'
  );

  role = new cf.shortcuts.CrossAccountRole({
    LogicalName: 'MyRole',
    Accounts: [
      '123456789012',
      'arn:aws:iam::123456789012:root',
      { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' }
    ],
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:GetObject',
        Resource: 'arn:aws:s3:::fake/data'
      }
    ],
    ManagedPolicyArns: ['arn:aws:iam::123456789012:policy/fake'],
    MaxSessionDuration: 3600,
    Path: '/fake/',
    RoleName: 'my-role',
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    role
  );
  if (update) fixtures.update('cross-account-role-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('cross-account-role-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] service role', (assert) => {
  assert.throws(
    () => new cf.shortcuts.ServiceRole(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.ServiceRole({}),
    /You must provide a LogicalName and Service/,
    'throws without required parameters'
  );

  let role = new cf.shortcuts.ServiceRole({
    LogicalName: 'MyRole',
    Service: 'lambda'
  });

  let template = cf.merge(role);
  if (update) fixtures.update('service-role-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('service-role-defaults'),
    'expected resources generated with defaults'
  );

  role = new cf.shortcuts.ServiceRole({
    LogicalName: 'MyRole',
    Service: 'lambda.amazonaws.com'
  });

  template = cf.merge(role);
  if (update) fixtures.update('service-role-no-url-suffix', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('service-role-no-url-suffix'),
    'expected resources generated, service for which AWS::URLSuffix is invalid'
  );

  role = new cf.shortcuts.ServiceRole({
    LogicalName: 'MyRole',
    Service: 'ec2'
  });

  template = cf.merge(role);
  if (update) fixtures.update('service-role-url-suffix', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('service-role-url-suffix'),
    'expected resources generated, service for which AWS::URLSuffix is invalid'
  );

  role = new cf.shortcuts.ServiceRole({
    LogicalName: 'MyRole',
    Service: 'ec2.amazonaws.com'
  });

  template = cf.merge(role);
  if (update)
    fixtures.update('service-role-url-suffix-with-replacement', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('service-role-url-suffix-with-replacement'),
    'expected resources generated, service for which AWS::URLSuffix is invalid specified with a suffix'
  );

  role = new cf.shortcuts.ServiceRole({
    LogicalName: 'MyRole',
    Service: 'lambda.amazonaws.com',
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:GetObject',
        Resource: 'arn:aws:s3:::fake/data'
      }
    ],
    ManagedPolicyArns: ['arn:aws:iam::123456789012:policy/fake'],
    MaxSessionDuration: 3600,
    Path: '/fake/',
    RoleName: 'my-role',
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    role
  );
  if (update) fixtures.update('service-role-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('service-role-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] glue database', (assert) => {
  assert.throws(
    () => new cf.shortcuts.GlueDatabase(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.GlueDatabase({}),
    /You must provide a LogicalName and Name/,
    'throws without required parameters'
  );

  let db = new cf.shortcuts.GlueDatabase({
    LogicalName: 'MyDatabase',
    Name: 'my_database'
  });

  let template = cf.merge(db);
  if (update) fixtures.update('glue-database-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-database-defaults'),
    'expected resources generated with defaults'
  );

  db = new cf.shortcuts.GlueDatabase({
    LogicalName: 'MyDatabase',
    Name: 'my_database',
    CatalogId: '123456',
    Description: 'my_database description',
    LocationUri: 'fakeuri',
    Parameters: { thing: 'a' },
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    db
  );
  if (update) fixtures.update('glue-database-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-database-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] glue table', (assert) => {
  assert.throws(
    () => new cf.shortcuts.GlueTable(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.GlueTable({}),
    /You must provide a LogicalName, Name, DatabaseName, and Columns/,
    'throws without required parameters'
  );

  let db = new cf.shortcuts.GlueTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ]
  });

  let template = cf.merge(db);
  if (update) fixtures.update('glue-table-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-table-defaults'),
    'expected resources generated with defaults'
  );

  db = new cf.shortcuts.GlueTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    CatalogId: '1234',
    Owner: 'Team',
    Parameters: { table: 'params' },
    Description: 'my_table description',
    Retention: 12,
    TableType: 'EXTERNAL_TABLE',
    ViewExpandedText: '/* Presto View */',
    ViewOriginalText: '/* Presto View: abc123= */',
    BucketColumns: ['column'],
    Compressed: true,
    InputFormat: 'fake.input.format',
    Location: 's3://fake/location',
    OutputFormat: 'fake.output.format',
    StorageParameters: { storage: 'parameters' },
    SerdeInfo: {
      SerializationLibrary: 'fake.serde'
    },
    SkewedColumns: {
      SkewedColumnNames: ['column'],
      SkewedColumnValueLocationMap: { fake: 'map' },
      SkewedColumnValues: ['value']
    },
    SortColumns: [
      { Column: 'column', SortOrder: 0 }
    ],
    StoredAsSubdirectory: true,
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    db
  );
  if (update) fixtures.update('glue-table-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-table-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] glue json table', (assert) => {
  assert.throws(
    () => new cf.shortcuts.GlueJsonTable(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.GlueJsonTable({}),
    /You must provide a Location/,
    'throws without required parameters'
  );

  let db = new cf.shortcuts.GlueJsonTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    Location: 's3://fake/location'
  });

  let template = cf.merge(db);
  if (update) fixtures.update('glue-json-table-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-json-table-defaults'),
    'expected resources generated with defaults'
  );

  db = new cf.shortcuts.GlueJsonTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    CatalogId: '1234',
    Owner: 'Team',
    Parameters: { table: 'params' },
    Description: 'my_table description',
    Retention: 12,
    TableType: 'EXTERNAL_TABLE',
    ViewExpandedText: '/* Presto View */',
    ViewOriginalText: '/* Presto View: abc123= */',
    BucketColumns: ['column'],
    Compressed: true,
    Location: 's3://fake/location',
    InputFormat: 'fake.input.format',
    OutputFormat: 'fake.output.format',
    StorageParameters: { storage: 'parameters' },
    SerdeInfo: {
      SerializationLibrary: 'fake.serde'
    },
    SkewedColumns: {
      SkewedColumnNames: ['column'],
      SkewedColumnValueLocationMap: { fake: 'map' },
      SkewedColumnValues: ['value']
    },
    SortColumns: [
      { Column: 'column', SortOrder: 0 }
    ],
    StoredAsSubdirectory: true,
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    db
  );
  if (update) fixtures.update('glue-json-table-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-json-table-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] glue orc table', (assert) => {
  assert.throws(
    () => new cf.shortcuts.GlueOrcTable(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.GlueOrcTable({}),
    /You must provide a Location/,
    'throws without required parameters'
  );

  let db = new cf.shortcuts.GlueOrcTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    Location: 's3://fake/location'
  });

  let template = cf.merge(db);
  if (update) fixtures.update('glue-orc-table-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-orc-table-defaults'),
    'expected resources generated with defaults'
  );

  db = new cf.shortcuts.GlueOrcTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    CatalogId: '1234',
    Owner: 'Team',
    Parameters: { table: 'params' },
    Description: 'my_table description',
    Retention: 12,
    TableType: 'EXTERNAL_TABLE',
    ViewExpandedText: '/* Presto View */',
    ViewOriginalText: '/* Presto View: abc123= */',
    BucketColumns: ['column'],
    Compressed: true,
    Location: 's3://fake/location',
    InputFormat: 'fake.input.format',
    OutputFormat: 'fake.output.format',
    StorageParameters: { storage: 'parameters' },
    SerdeInfo: {
      SerializationLibrary: 'fake.serde'
    },
    SkewedColumns: {
      SkewedColumnNames: ['column'],
      SkewedColumnValueLocationMap: { fake: 'map' },
      SkewedColumnValues: ['value']
    },
    SortColumns: [
      { Column: 'column', SortOrder: 0 }
    ],
    StoredAsSubdirectory: true,
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    db
  );
  if (update) fixtures.update('glue-orc-table-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-orc-table-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] glue parquet table', (assert) => {
  assert.throws(
    () => new cf.shortcuts.GlueParquetTable(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.GlueParquetTable({}),
    /You must provide a Location/,
    'throws without required parameters'
  );

  let db = new cf.shortcuts.GlueParquetTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    Location: 's3://fake/location'
  });

  let template = cf.merge(db);
  if (update) fixtures.update('glue-parquet-table-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-parquet-table-defaults'),
    'expected resources generated with defaults'
  );

  db = new cf.shortcuts.GlueParquetTable({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_table',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    CatalogId: '1234',
    Owner: 'Team',
    Parameters: { table: 'params' },
    Description: 'my_table description',
    Retention: 12,
    TableType: 'EXTERNAL_TABLE',
    ViewExpandedText: '/* Presto View */',
    ViewOriginalText: '/* Presto View: abc123= */',
    BucketColumns: ['column'],
    Compressed: true,
    Location: 's3://fake/location',
    InputFormat: 'fake.input.format',
    OutputFormat: 'fake.output.format',
    StorageParameters: { storage: 'parameters' },
    SerdeInfo: {
      SerializationLibrary: 'fake.serde'
    },
    SkewedColumns: {
      SkewedColumnNames: ['column'],
      SkewedColumnValueLocationMap: { fake: 'map' },
      SkewedColumnValues: ['value']
    },
    SortColumns: [
      { Column: 'column', SortOrder: 0 }
    ],
    StoredAsSubdirectory: true,
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    db
  );
  if (update) fixtures.update('glue-parquet-table-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-parquet-table-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

test('[shortcuts] glue view', (assert) => {
  assert.throws(
    () => new cf.shortcuts.GluePrestoView(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.GluePrestoView({}),
    /You must provide a DatabaseName, Columns, and OriginalSql/,
    'throws without required parameters'
  );

  let db = new cf.shortcuts.GluePrestoView({
    LogicalName: 'MyView',
    DatabaseName: 'my_database',
    Name: 'my_view',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    OriginalSql: 'SELECT * FROM another.table'
  });

  let template = cf.merge(db);
  if (update) fixtures.update('glue-view-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-view-defaults'),
    'expected resources generated with defaults'
  );

  db = new cf.shortcuts.GluePrestoView({
    LogicalName: 'MyTable',
    DatabaseName: 'my_database',
    Name: 'my_view',
    Columns: [
      { Name: 'column', Type: 'string' }
    ],
    OriginalSql: 'SELECT * FROM another.table',
    CatalogId: '1234',
    Owner: 'Team',
    Parameters: { table: 'params' },
    Description: 'my_view description',
    Retention: 12,
    TableType: 'EXTERNAL_TABLE',
    BucketColumns: ['column'],
    Compressed: true,
    Location: 's3://fake/location',
    InputFormat: 'fake.input.format',
    OutputFormat: 'fake.output.format',
    StorageParameters: { storage: 'parameters' },
    SerdeInfo: {
      SerializationLibrary: 'fake.serde'
    },
    SkewedColumns: {
      SkewedColumnNames: ['column'],
      SkewedColumnValueLocationMap: { fake: 'map' },
      SkewedColumnValues: ['value']
    },
    SortColumns: [
      { Column: 'column', SortOrder: 0 }
    ],
    StoredAsSubdirectory: true,
    SqlVariables: { env: { Ref: 'AWS::StackName' } },
    Condition: 'Always',
    DependsOn: 'AnotherThing'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
    db
  );
  if (update) fixtures.update('glue-view-no-defaults', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('glue-view-no-defaults'),
    'expected resources generated without defaults'
  );

  assert.end();
});

const normalizeDeployment = (template) => {
  const str = JSON.stringify(template).replace(
    /Deployment([0-9a-f]{8})/g,
    'Deployment'
  );
  return JSON.parse(str);
};

test('[shortcuts] hookshot passthrough', (assert) => {
  assert.throws(
    () => new cf.shortcuts.hookshot.Passthrough(),
    'Options required',
    'throws without options'
  );
  assert.throws(
    () => new cf.shortcuts.hookshot.Passthrough({}),
    /You must provide a Prefix, and PassthroughTo/,
    'throws without required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.hookshot.Passthrough({
        Prefix: 'Pass',
        PassthroughTo: 'Destination',
        LoggingLevel: 'HAM'
      }),
    /LoggingLevel must be one of OFF, INFO, or ERROR/,
    'throws with invalid LoggingLevel'
  );

  assert.throws(
    () =>
      new cf.shortcuts.hookshot.Passthrough({
        Prefix: 'Pass',
        PassthroughTo: 'Destination',
        LoggingLevel: 'INFO',
        Runtime: 'python3.7'
      }),
    /Only valid nodejs runtimes are supported for hookshot lambdas, received: 'python3.7'/,
    'throws with invalid lambda Runtime python3.7'
  );

  assert.throws(
    () =>
      new cf.shortcuts.hookshot.Passthrough({
        Prefix: 'Pass',
        PassthroughTo: 'Destination',
        LoggingLevel: 'INFO',
        Runtime: 'nodejs16.x'
      }),
    /Only nodejs runtimes >= 18 are supported for hookshot lambdas, received: 'nodejs16.x'/,
    'throws with invalid lambda Runtime nodejs16.x'
  );

  const to = new cf.shortcuts.Lambda({
    LogicalName: 'Destination',
    Code: {
      ZipFile: 'module.exports.handler = (e, c, cb) => cb();'
    }
  });

  let passthrough = new cf.shortcuts.hookshot.Passthrough({
    Prefix: 'Pass',
    PassthroughTo: 'Destination'
  });

  let template = cf.merge(passthrough, to);
  if (update) fixtures.update('hookshot-passthrough', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-passthrough')),
    'expected resources generated with defaults'
  );

  passthrough = new cf.shortcuts.hookshot.Passthrough({
    Prefix: 'Pass',
    PassthroughTo: 'Destination',
    AlarmActions: ['devnull@mapbox.com']
  });

  template = cf.merge(passthrough, to);
  if (update) fixtures.update('hookshot-passthrough-alarms', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-passthrough-alarms')),
    'expected resources generated with alarm config'
  );

  passthrough = new cf.shortcuts.hookshot.Passthrough({
    Prefix: 'Pass',
    PassthroughTo: 'Destination',
    LoggingLevel: 'INFO'
  });

  template = cf.merge(passthrough, to);
  if (update) fixtures.update('hookshot-passthrough-logging', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-passthrough-logging')),
    'expected resources generated with configured LoggingLevel'
  );

  passthrough = new cf.shortcuts.hookshot.Passthrough({
    Prefix: 'Pass',
    PassthroughTo: 'Destination',
    DataTraceEnabled: true,
    MetricsEnabled: true
  });

  template = cf.merge(passthrough, to);
  if (update)
    fixtures.update('hookshot-passthrough-enhanced-logging', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-passthrough-enhanced-logging')),
    'expected resources generated with detailed logging and metrics'
  );

  passthrough = new cf.shortcuts.hookshot.Passthrough({
    Prefix: 'Pass',
    PassthroughTo: 'Destination',
    DataTraceEnabled: true,
    MetricsEnabled: true,
    LoggingLevel: 'INFO'
  });

  template = cf.merge(passthrough, to);
  if (update)
    fixtures.update('hookshot-passthrough-full-blown-logging', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(
      fixtures.get('hookshot-passthrough-full-blown-logging')
    ),
    'LoggingLevel respected with detailed logging and metrics'
  );

  passthrough = new cf.shortcuts.hookshot.Passthrough({
    Prefix: 'Pass',
    PassthroughTo: 'Destination',
    AccessLogFormat: '{ "requestId":"$context.requestId" }'
  });

  template = cf.merge(passthrough, to);
  if (update)
    fixtures.update('hookshot-passthrough-access-log-format', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-passthrough-access-log-format')),
    'expected resources generated with access logs'
  );

  assert.end();
});

test('[shortcuts] hookshot github', (assert) => {
  assert.throws(
    () => new cf.shortcuts.hookshot.Github(),
    /You must provide a Prefix, and PassthroughTo/,
    'throws without required parameters'
  );

  assert.throws(
    () =>
      new cf.shortcuts.hookshot.Github({
        Prefix: 'Pass',
        PassthroughTo: 'Destination',
        Runtime: 'python3.7'
      }),
    /Only valid nodejs runtimes are supported for hookshot lambdas, received: 'python3.7'/,
    'throws with invalid lambda Runtime python3.7'
  );

  assert.throws(
    () =>
      new cf.shortcuts.hookshot.Github({
        Prefix: 'Pass',
        PassthroughTo: 'Destination',
        Runtime: 'nodejs16.x'
      }),
    /Only nodejs runtimes >= 18 are supported for hookshot lambdas, received: 'nodejs16.x'/,
    'throws with invalid lambda Runtime nodejs16.x'
  );

  const to = new cf.shortcuts.Lambda({
    LogicalName: 'Destination',
    Code: {
      ZipFile: 'module.exports.handler = (e, c, cb) => cb();'
    }
  });

  let github = new cf.shortcuts.hookshot.Github({
    Prefix: 'Pass',
    PassthroughTo: 'Destination'
  });

  let template = cf.merge(github, to);
  if (update) fixtures.update('hookshot-github', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-github')),
    'expected resources generated with defaults'
  );

  github = new cf.shortcuts.hookshot.Github({
    Prefix: 'Pass',
    PassthroughTo: 'Destination',
    WebhookSecret: 'abc123'
  });

  template = cf.merge(github, to);
  if (update) fixtures.update('hookshot-github-secret-string', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-github-secret-string')),
    'expected resources generated when secret passed as string'
  );

  github = new cf.shortcuts.hookshot.Github({
    Prefix: 'Pass',
    PassthroughTo: 'Destination',
    WebhookSecret: cf.ref('SomeParameter')
  });
  const Parameters = { SomeParameter: { Type: 'String' } };
  template = cf.merge(github, to, { Parameters });
  if (update) fixtures.update('hookshot-github-secret-ref', template);
  assert.deepEqual(
    normalizeDeployment(noUndefined(template)),
    normalizeDeployment(fixtures.get('hookshot-github-secret-ref')),
    'expected resources generated when secret passed as ref'
  );

  assert.end();
});
