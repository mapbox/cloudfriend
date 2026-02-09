'use strict';

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const cf = require('..');
const fixtures = require('./fixtures/shortcuts');
const util = require('util');
const sleep = util.promisify(setTimeout);

const update = !!process.env.UPDATE;

const noUndefined = (template) => JSON.parse(JSON.stringify(template));

describe('[shortcuts] fixture validation', () => {
  // Runs cfn-lint, ignoring "warnings". Install via pip or Homebrew to run these
  // tests locally.
  const cfnLint = (filepath, filename) => new Promise((resolve, reject) => {
    // Ignore E3003 (missing TableInput) and E3002 (unexpected properties) for Iceberg tables only
    // cfn-lint doesn't yet support OpenTableFormatInput (Iceberg table format)
    const isIcebergTable = filename.includes('glue-iceberg-table');
    const ignoreChecks = isIcebergTable ? 'W,E3003,E3002' : 'W';

    cp.execFile('cfn-lint', [filepath, '--ignore-checks', ignoreChecks], (err, stdout) => {
      if (err) return reject(new Error(stdout));
      return resolve();
    });
  });

  const toValidate = fs
    .readdirSync(path.join(__dirname, 'fixtures', 'shortcuts'))
    .filter((filename) => path.extname(filename) === '.json');

  test.each(toValidate)('%s fixture passes validation', async (filename) => {
    await Promise.all([
      cfnLint(path.join(__dirname, 'fixtures', 'shortcuts', filename), filename),
      sleep(1000)
    ]);
  });
});

describe('[shortcuts] lambda', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.Lambda()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.Lambda({})).toThrow(/You must provide a LogicalName, and Code/);
  });

  test('throws for RoleArn and Statements both provided', () => {
    expect(() => new cf.shortcuts.Lambda({
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
    })).toThrow(/You cannot specify both Statements and a RoleArn/);
  });

  test('expected resources generated using all default values', () => {
    const lambda = new cf.shortcuts.Lambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    });

    const template = cf.merge(lambda);
    if (update) fixtures.update('lambda-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('lambda-defaults'));
  });

  test('LogPolicyDeletionPolicy=Retain sets DeletionPolicy on IAM Policy resource', () => {
    const lambdaWithRetain = new cf.shortcuts.Lambda({
      LogicalName: 'MyLambda',
      Code: { S3Bucket: 'my-code-bucket', S3Key: 'path/to/code.zip' },
      LogPolicyDeletionPolicy: 'Retain'
    });
    const templateWithRetain = cf.merge(lambdaWithRetain);
    expect(templateWithRetain.Resources.MyLambdaLogPolicy.DeletionPolicy).toBe('Retain');
  });

  test('expected resources generated using all default values and a docker image', () => {
    const lambda = new cf.shortcuts.Lambda({
      LogicalName: 'MyLambda',
      Code: {
        ImageUri: 'MyImage'
      }
    });

    const template = cf.merge(lambda);
    if (update) fixtures.update('lambda-docker', template);
    expect(noUndefined(template)).toEqual(fixtures.get('lambda-docker'));
  });

  test('expected resources generated using all default values and inline code', () => {
    const lambda = new cf.shortcuts.Lambda({
      LogicalName: 'MyLambda',
      Code: {
        ZipFile: 'fake code'
      }
    });

    const template = cf.merge(lambda);
    if (update) fixtures.update('lambda-zipfile', template);
    expect(noUndefined(template)).toEqual(fixtures.get('lambda-zipfile'));
  });

  test('expected resources generated if RoleArn provided', () => {
    const lambda = new cf.shortcuts.Lambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      RoleArn: cf.getAtt('CustomLambdaRole', 'Arn')
    });

    const template = cf.merge(lambda, {
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
    expect(noUndefined(template)).toEqual(fixtures.get('lambda-provided-role'));
  });

  test('expected resources generated using no default values', () => {
    const lambda = new cf.shortcuts.Lambda({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      lambda
    );
    if (update) fixtures.update('lambda-full', template);
    expect(noUndefined(template)).toEqual(fixtures.get('lambda-full'));
  });

  test('LogPolicyName parameter correctly overrides the default policy name', () => {
    const lambda = new cf.shortcuts.Lambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      LogPolicyName: 'CustomLogPolicyName'
    });

    const template = cf.merge(lambda);
    expect(template.Resources.MyLambdaLogPolicy.Properties.PolicyName).toBe('CustomLogPolicyName');
  });
});

describe('[shortcuts] queue-lambda', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.QueueLambda()).toThrow('Options required');
  });

  test('throws without basic lambda required parameters', () => {
    expect(() => new cf.shortcuts.QueueLambda({})).toThrow(/You must provide a LogicalName, and Code/);
  });

  test('throws without queue-lambda required parameters', () => {
    expect(() => new cf.shortcuts.QueueLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    })).toThrow(/You must provide an EventSourceArn and ReservedConcurrentExecutions/);
  });

  test('throws when ReservedConcurrentExecutions is a negative number', () => {
    expect(() => new cf.shortcuts.QueueLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake',
      ReservedConcurrentExecutions: -1
    })).toThrow(/ReservedConcurrentExecutions must be greater than or equal to 0/);
  });

  test('expected resources generated with zero concurrency', () => {
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
    expect(noUndefined(zeroTemplate)).toEqual(fixtures.get('queue-lambda-zero'));
  });

  test('expected resources generated', () => {
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
    expect(noUndefined(template)).toEqual(fixtures.get('queue-lambda'));
  });
});

describe('[shortcuts] scheduled-lambda', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.ScheduledLambda()).toThrow('Options required');
  });

  test('throws without basic lambda required parameters', () => {
    expect(() => new cf.shortcuts.ScheduledLambda({})).toThrow(/You must provide a LogicalName, and Code/);
  });

  test('throws without scheduled-lambda required parameters', () => {
    expect(() => new cf.shortcuts.ScheduledLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    })).toThrow(/You must provide a ScheduleExpression/);
  });

  test('expected resources generated with defaults', () => {
    const lambda = new cf.shortcuts.ScheduledLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      ScheduleExpression: 'rate(1 hour)'
    });

    const template = cf.merge(lambda);
    if (update) fixtures.update('scheduled-lambda-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('scheduled-lambda-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const lambda = new cf.shortcuts.ScheduledLambda({
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

    const template = cf.merge(lambda);
    if (update) fixtures.update('scheduled-lambda-full', template);
    expect(noUndefined(template)).toEqual(fixtures.get('scheduled-lambda-full'));
  });
});

describe('[shortcuts] event-lambda', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.EventLambda()).toThrow('Options required');
  });

  test('throws without basic lambda required parameters', () => {
    expect(() => new cf.shortcuts.EventLambda({})).toThrow(/You must provide a LogicalName, and Code/);
  });

  test('throws without event-lambda required parameters', () => {
    expect(() => new cf.shortcuts.EventLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    })).toThrow(/You must provide an EventPattern/);
  });

  test('expected resources generated with defaults', () => {
    const lambda = new cf.shortcuts.EventLambda({
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

    const template = cf.merge(lambda);
    if (update) fixtures.update('event-lambda-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('event-lambda-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const lambda = new cf.shortcuts.EventLambda({
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

    const template = cf.merge(lambda);
    if (update) fixtures.update('event-lambda-full', template);
    expect(noUndefined(template)).toEqual(fixtures.get('event-lambda-full'));
  });
});

describe('[shortcuts] stream-lambda', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.StreamLambda()).toThrow('Options required');
  });

  test('throws without basic lambda required parameters', () => {
    expect(() => new cf.shortcuts.StreamLambda({})).toThrow(/You must provide a LogicalName, and Code/);
  });

  test('throws without stream-lambda required parameters', () => {
    expect(() => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    })).toThrow(/You must provide an EventSourceArn/);
  });

  test('expected resources generated via defaults', () => {
    const lambda = new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake'
    });

    const template = cf.merge(lambda);
    if (update) fixtures.update('stream-lambda-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('stream-lambda-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const lambda = new cf.shortcuts.StreamLambda({
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

    const template = cf.merge(lambda);
    if (update) fixtures.update('stream-lambda-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('stream-lambda-no-defaults'));
  });
});

describe('[shortcuts] StreamLambda FilterCriteria', () => {
  test('FilterCriteria must be a JSON-like object', () => {
    expect(() => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: ['test']
    })).toThrow();
  });

  test('FilterCriteria must contain property Filter of type array', () => {
    expect(() => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: {}
    })).toThrow();
  });

  test('FilterCriteria.Filter must be an array', () => {
    expect(() => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/fake',
      FilterCriteria: {
        Filter: 613
      }
    })).toThrow();
  });

  test('FilterCriteria.Filter objects must have Pattern property', () => {
    expect(() => new cf.shortcuts.StreamLambda({
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
    })).toThrow();
  });

  test('FilterCriteria.Filter Pattern must be JSON parseable string', () => {
    expect(() => new cf.shortcuts.StreamLambda({
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
    })).toThrow();
  });
});

describe('[shortcuts] log-subscription-lambda', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.LogSubscriptionLambda()).toThrow('Options required');
  });

  test('throws without basic lambda required parameters', () => {
    expect(() => new cf.shortcuts.LogSubscriptionLambda({})).toThrow(/You must provide a LogicalName, and Code/);
  });

  test('throws without log-subscription-lambda required parameters', () => {
    expect(() => new cf.shortcuts.LogSubscriptionLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    })).toThrow(/You must provide a LogGroupName/);
  });

  test('expected resources generated via defaults', () => {
    const lambda = new cf.shortcuts.LogSubscriptionLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      LogGroupName: 'my-log-group'
    });

    const template = cf.merge(lambda);
    if (update) fixtures.update('log-subscription-lambda-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('log-subscription-lambda-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const lambda = new cf.shortcuts.LogSubscriptionLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      },
      FilterPattern: '{ $.errorCode = 400 }',
      LogGroupName: 'my-log-group'
    });

    const template = cf.merge(lambda);
    if (update) fixtures.update('log-subscription-lambda-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('log-subscription-lambda-no-defaults'));
  });
});

describe('[shortcuts] queue', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.Queue()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.Queue({})).toThrow(/You must provide a LogicalName/);
  });

  test('expected resources generated for full defaults', () => {
    const queue = new cf.shortcuts.Queue({
      LogicalName: 'MyQueue'
    });

    const template = cf.merge(queue);
    if (update) fixtures.update('queue-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('queue-defaults'));
  });

  test('expected resources generated no defaults', () => {
    const queue = new cf.shortcuts.Queue({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      queue
    );
    if (update) fixtures.update('queue-full', template);
    expect(noUndefined(template)).toEqual(fixtures.get('queue-full'));
  });

  test('expected resources generated for external topic', () => {
    const queue = new cf.shortcuts.Queue({
      LogicalName: 'MyQueue',
      ExistingTopicArn: 'arn:aws:sns:us-east-1:111122223333:MyTopic'
    });
    const template = cf.merge(queue);
    if (update) fixtures.update('queue-external-topic', template);
    expect(noUndefined(template)).toEqual(fixtures.get('queue-external-topic'));
  });

  test('expected resources generated for external topic identified by ref', () => {
    const queue = new cf.shortcuts.Queue({
      LogicalName: 'MyQueue',
      ExistingTopicArn: { Ref: 'TopicForOtherThing' }
    });
    const template = cf.merge(
      { Resources: { TopicForOtherThing: { Type: 'AWS::SNS::Topic' } } },
      queue
    );
    if (update) fixtures.update('queue-external-topic-ref', template);
    expect(noUndefined(template)).toEqual(fixtures.get('queue-external-topic-ref'));
  });

  test('expected resources generated for FIFO queue', () => {
    const queue = new cf.shortcuts.Queue({
      LogicalName: 'MyFifoQueue',
      FifoQueue: true
    });
    const template = cf.merge(queue);
    if (update) fixtures.update('queue-fifo', template);
    expect(noUndefined(template)).toEqual(fixtures.get('queue-fifo'));
  });

  test('expected resources generated for FIFO queue with specified QueueName', () => {
    const queue = new cf.shortcuts.Queue({
      LogicalName: 'MyFifoQueue',
      QueueName: 'custom-and-fancy',
      FifoQueue: true
    });
    const template = cf.merge(queue);
    if (update) fixtures.update('queue-fifo-queuename', template);
    expect(noUndefined(template)).toEqual(fixtures.get('queue-fifo-queuename'));
  });

  test('the FifoQueue value false is converted to undefined, to pass CFN validation', () => {
    const queue = new cf.shortcuts.Queue({
      LogicalName: 'MyFifoFalseQueue',
      FifoQueue: false
    });
    const template = cf.merge(queue);
    expect(template.Resources.MyFifoFalseQueue.Properties.FifoQueue).toBeUndefined();
  });
});

describe('[shortcuts] s3 kinesis firehose', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.S3KinesisFirehose()).toThrow('Options required');
  });

  test('throws without required LogicalName parameter', () => {
    expect(() => new cf.shortcuts.S3KinesisFirehose({})).toThrow(/You must provide a LogicalName/);
  });

  test('throws without required DestinationBucket parameter', () => {
    expect(() => new cf.shortcuts.S3KinesisFirehose({
      LogicalName: 'MyKinesisFirehose'
    })).toThrow(/You must provide a DestinationBucket/);
  });

  test('expected resources generated for full defaults', () => {
    const firehose = new cf.shortcuts.S3KinesisFirehose({
      LogicalName: 'MyKinesisFirehose',
      DestinationBucket: 'mah-bukkit'
    });

    const template = cf.merge(firehose);
    if (update) fixtures.update('firehose-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('firehose-defaults'));
  });

  test('expected resources generated with stream', () => {
    const firehose = new cf.shortcuts.S3KinesisFirehose({
      LogicalName: 'MyKinesisFirehose',
      DestinationBucket: 'mah-bukkit',
      KinesisStreamARN: 'arn:aws:kinesis:us-east-1:111122223333:stream/my-stream'
    });

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      firehose
    );
    if (update) fixtures.update('firehose-with-stream', template);
    expect(noUndefined(template)).toEqual(fixtures.get('firehose-with-stream'));
  });
});

describe('[shortcuts] role', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.Role()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.Role({})).toThrow(/You must provide a LogicalName and AssumeRolePrincipals/);
  });

  test('expected resources generated with defaults', () => {
    const role = new cf.shortcuts.Role({
      LogicalName: 'MyRole',
      AssumeRolePrincipals: [{ Service: 'ec2.amazonaws.com' }]
    });

    const template = cf.merge(role);
    if (update) fixtures.update('role-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('role-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const role = new cf.shortcuts.Role({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      role
    );
    if (update) fixtures.update('role-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('role-no-defaults'));
  });
});

describe('[shortcuts] cross-account role', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.CrossAccountRole()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.CrossAccountRole({})).toThrow(/You must provide a LogicalName and Accounts/);
  });

  test('expected resources generated with defaults', () => {
    const role = new cf.shortcuts.CrossAccountRole({
      LogicalName: 'MyRole',
      Accounts: [
        '123456789012',
        'arn:aws:iam::123456789012:root',
        { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' }
      ]
    });

    const template = cf.merge(role);
    if (update) fixtures.update('cross-account-role-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('cross-account-role-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const role = new cf.shortcuts.CrossAccountRole({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      role
    );
    if (update) fixtures.update('cross-account-role-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('cross-account-role-no-defaults'));
  });
});

describe('[shortcuts] service role', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.ServiceRole()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.ServiceRole({})).toThrow(/You must provide a LogicalName and Service/);
  });

  test('expected resources generated with defaults', () => {
    const role = new cf.shortcuts.ServiceRole({
      LogicalName: 'MyRole',
      Service: 'lambda'
    });

    const template = cf.merge(role);
    if (update) fixtures.update('service-role-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('service-role-defaults'));
  });

  test('expected resources generated, service for which AWS::URLSuffix is invalid', () => {
    const role = new cf.shortcuts.ServiceRole({
      LogicalName: 'MyRole',
      Service: 'lambda.amazonaws.com'
    });

    const template = cf.merge(role);
    if (update) fixtures.update('service-role-no-url-suffix', template);
    expect(noUndefined(template)).toEqual(fixtures.get('service-role-no-url-suffix'));
  });

  test('expected resources generated, service for which AWS::URLSuffix is valid', () => {
    const role = new cf.shortcuts.ServiceRole({
      LogicalName: 'MyRole',
      Service: 'ec2'
    });

    const template = cf.merge(role);
    if (update) fixtures.update('service-role-url-suffix', template);
    expect(noUndefined(template)).toEqual(fixtures.get('service-role-url-suffix'));
  });

  test('expected resources generated, service for which AWS::URLSuffix is invalid specified with a suffix', () => {
    const role = new cf.shortcuts.ServiceRole({
      LogicalName: 'MyRole',
      Service: 'ec2.amazonaws.com'
    });

    const template = cf.merge(role);
    if (update) fixtures.update('service-role-url-suffix-with-replacement', template);
    expect(noUndefined(template)).toEqual(fixtures.get('service-role-url-suffix-with-replacement'));
  });

  test('expected resources generated without defaults', () => {
    const role = new cf.shortcuts.ServiceRole({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      role
    );
    if (update) fixtures.update('service-role-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('service-role-no-defaults'));
  });
});

describe('[shortcuts] glue database', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.GlueDatabase()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.GlueDatabase({})).toThrow(/You must provide a LogicalName and Name/);
  });

  test('expected resources generated with defaults', () => {
    const db = new cf.shortcuts.GlueDatabase({
      LogicalName: 'MyDatabase',
      Name: 'my_database'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-database-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-database-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const db = new cf.shortcuts.GlueDatabase({
      LogicalName: 'MyDatabase',
      Name: 'my_database',
      CatalogId: '123456',
      Description: 'my_database description',
      LocationUri: 'fakeuri',
      Parameters: { thing: 'a' },
      Condition: 'Always',
      DependsOn: 'AnotherThing'
    });

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      db
    );
    if (update) fixtures.update('glue-database-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-database-no-defaults'));
  });
});

describe('[shortcuts] glue table', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.GlueTable()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.GlueTable({})).toThrow(/You must provide a LogicalName, Name, DatabaseName, and Columns/);
  });

  test('expected resources generated with defaults', () => {
    const db = new cf.shortcuts.GlueTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Columns: [
        { Name: 'column', Type: 'string' }
      ]
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-table-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-table-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const db = new cf.shortcuts.GlueTable({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      db
    );
    if (update) fixtures.update('glue-table-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-table-no-defaults'));
  });
});

describe('[shortcuts] glue json table', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.GlueJsonTable()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.GlueJsonTable({})).toThrow(/You must provide a Location/);
  });

  test('expected resources generated with defaults', () => {
    const db = new cf.shortcuts.GlueJsonTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Columns: [
        { Name: 'column', Type: 'string' }
      ],
      Location: 's3://fake/location'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-json-table-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-json-table-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const db = new cf.shortcuts.GlueJsonTable({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      db
    );
    if (update) fixtures.update('glue-json-table-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-json-table-no-defaults'));
  });
});

describe('[shortcuts] glue orc table', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.GlueOrcTable()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.GlueOrcTable({})).toThrow(/You must provide a Location/);
  });

  test('expected resources generated with defaults', () => {
    const db = new cf.shortcuts.GlueOrcTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Columns: [
        { Name: 'column', Type: 'string' }
      ],
      Location: 's3://fake/location'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-orc-table-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-orc-table-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const db = new cf.shortcuts.GlueOrcTable({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      db
    );
    if (update) fixtures.update('glue-orc-table-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-orc-table-no-defaults'));
  });
});

describe('[shortcuts] glue parquet table', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.GlueParquetTable()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.GlueParquetTable({})).toThrow(/You must provide a Location/);
  });

  test('expected resources generated with defaults', () => {
    const db = new cf.shortcuts.GlueParquetTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Columns: [
        { Name: 'column', Type: 'string' }
      ],
      Location: 's3://fake/location'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-parquet-table-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-parquet-table-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const db = new cf.shortcuts.GlueParquetTable({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      db
    );
    if (update) fixtures.update('glue-parquet-table-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-parquet-table-no-defaults'));
  });
});

describe('[shortcuts] glue iceberg table', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.GlueIcebergTable()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.GlueIcebergTable({})).toThrow(/You must provide a LogicalName, Name, DatabaseName, Location, and Schema/);
  });

  test('expected resources generated with defaults', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-iceberg-table-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      CatalogId: '1234',
      Location: 's3://fake/location',
      IcebergVersion: '2'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-iceberg-table-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-no-defaults'));
  });

  test('throws when EnableOptimizer is true but OptimizerRoleArn is missing', () => {
    expect(() => new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOptimizer: true
    })).toThrow(/You must provide an OptimizerRoleArn when EnableOptimizer is true/);
  });

  test('expected resources generated with optimizer using default retention settings', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOptimizer: true,
      OptimizerRoleArn: 'arn:aws:iam::123456789012:role/OptimizerRole'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-iceberg-table-with-optimizer-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-optimizer-defaults'));
  });

  test('expected resources generated with optimizer using custom retention settings', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOptimizer: true,
      OptimizerRoleArn: cf.getAtt('OptimizerRole', 'Arn'),
      SnapshotRetentionPeriodInDays: 7,
      NumberOfSnapshotsToRetain: 3,
      CleanExpiredFiles: false
    });

    const template = cf.merge(
      { Resources: { OptimizerRole: { Type: 'AWS::IAM::Role', Properties: { AssumeRolePolicyDocument: {} } } } },
      db
    );
    if (update) fixtures.update('glue-iceberg-table-with-optimizer-custom', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-optimizer-custom'));
  });

  test('throws when EnableCompaction is true but CompactionRoleArn is missing', () => {
    expect(() => new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableCompaction: true
    })).toThrow(/You must provide a CompactionRoleArn when EnableCompaction is true/);
  });

  test('expected resources generated with compaction using default settings', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableCompaction: true,
      CompactionRoleArn: 'arn:aws:iam::123456789012:role/CompactionRole'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-iceberg-table-with-compaction-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-compaction-defaults'));
  });

  test('expected resources generated with compaction using custom settings', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableCompaction: true,
      CompactionRoleArn: cf.getAtt('CompactionRole', 'Arn')
    });

    const template = cf.merge(
      { Resources: { CompactionRole: { Type: 'AWS::IAM::Role', Properties: { AssumeRolePolicyDocument: {} } } } },
      db
    );
    if (update) fixtures.update('glue-iceberg-table-with-compaction-custom', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-compaction-custom'));
  });

  test('expected resources generated with both retention and compaction optimizers', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOptimizer: true,
      OptimizerRoleArn: 'arn:aws:iam::123456789012:role/RetentionRole',
      EnableCompaction: true,
      CompactionRoleArn: 'arn:aws:iam::123456789012:role/CompactionRole'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-iceberg-table-with-both-optimizers', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-both-optimizers'));
  });

  test('throws when EnableOrphanFileDeletion is true but OrphanFileDeletionRoleArn is missing', () => {
    expect(() => new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOrphanFileDeletion: true
    })).toThrow(/You must provide an OrphanFileDeletionRoleArn when EnableOrphanFileDeletion is true/);
  });

  test('expected resources generated with orphan file deletion using default settings', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOrphanFileDeletion: true,
      OrphanFileDeletionRoleArn: 'arn:aws:iam::123456789012:role/OrphanFileDeletionRole'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-iceberg-table-with-orphan-deletion-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-orphan-deletion-defaults'));
  });

  test('expected resources generated with orphan file deletion using custom settings', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOrphanFileDeletion: true,
      OrphanFileDeletionRoleArn: cf.getAtt('OrphanFileDeletionRole', 'Arn'),
      OrphanFileRetentionPeriodInDays: 7,
      OrphanFileDeletionLocation: 's3://fake/location/subdir'
    });

    const template = cf.merge(
      { Resources: { OrphanFileDeletionRole: { Type: 'AWS::IAM::Role', Properties: { AssumeRolePolicyDocument: {} } } } },
      db
    );
    if (update) fixtures.update('glue-iceberg-table-with-orphan-deletion-custom', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-orphan-deletion-custom'));
  });

  test('expected resources generated with all three optimizers using same role', () => {
    const db = new cf.shortcuts.GlueIcebergTable({
      LogicalName: 'MyTable',
      DatabaseName: 'my_database',
      Name: 'my_table',
      Schema: {
        Type: 'struct',
        Fields: [
          { Name: 'column', Type: 'string', Id: 1, Required: true }
        ]
      },
      Location: 's3://fake/location',
      EnableOptimizer: true,
      OptimizerRoleArn: 'arn:aws:iam::123456789012:role/SharedRole',
      EnableCompaction: true,
      CompactionRoleArn: 'arn:aws:iam::123456789012:role/SharedRole',
      EnableOrphanFileDeletion: true,
      OrphanFileDeletionRoleArn: 'arn:aws:iam::123456789012:role/SharedRole'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-iceberg-table-with-all-optimizers', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-iceberg-table-with-all-optimizers'));
  });
});

describe('[shortcuts] glue view', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.GluePrestoView()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.GluePrestoView({})).toThrow(/You must provide a DatabaseName, Columns, and OriginalSql/);
  });

  test('expected resources generated with defaults', () => {
    const db = new cf.shortcuts.GluePrestoView({
      LogicalName: 'MyView',
      DatabaseName: 'my_database',
      Name: 'my_view',
      Columns: [
        { Name: 'column', Type: 'string' }
      ],
      OriginalSql: 'SELECT * FROM another.table'
    });

    const template = cf.merge(db);
    if (update) fixtures.update('glue-view-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-view-defaults'));
  });

  test('expected resources generated without defaults', () => {
    const db = new cf.shortcuts.GluePrestoView({
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

    const template = cf.merge(
      { Conditions: { Always: cf.equals('1', '1') } },
      { Resources: { AnotherThing: { Type: 'AWS::SNS::Topic' } } },
      db
    );
    if (update) fixtures.update('glue-view-no-defaults', template);
    expect(noUndefined(template)).toEqual(fixtures.get('glue-view-no-defaults'));
  });
});

const normalizeDeployment = (template) => {
  const str = JSON.stringify(template).replace(
    /Deployment([0-9a-f]{8})/g,
    'Deployment'
  );
  return JSON.parse(str);
};

describe('[shortcuts] hookshot passthrough', () => {
  test('throws without options', () => {
    expect(() => new cf.shortcuts.hookshot.Passthrough()).toThrow('Options required');
  });

  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.hookshot.Passthrough({})).toThrow(/You must provide a Prefix, and PassthroughTo/);
  });

  test('throws with invalid LoggingLevel', () => {
    expect(() => new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      LoggingLevel: 'HAM'
    })).toThrow(/LoggingLevel must be one of OFF, INFO, or ERROR/);
  });

  test('throws with invalid lambda Runtime python3.7', () => {
    expect(() => new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      LoggingLevel: 'INFO',
      Runtime: 'python3.7'
    })).toThrow(/Only valid nodejs runtimes are supported for hookshot lambdas, received: 'python3.7'/);
  });

  test('throws with invalid lambda Runtime nodejs16.x', () => {
    expect(() => new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      LoggingLevel: 'INFO',
      Runtime: 'nodejs16.x'
    })).toThrow(/Only nodejs runtimes >= 18 are supported for hookshot lambdas, received: 'nodejs16.x'/);
  });

  const getDestinationLambda = () => new cf.shortcuts.Lambda({
    LogicalName: 'Destination',
    Code: {
      ZipFile: 'module.exports.handler = (e, c, cb) => cb();'
    }
  });

  test('expected resources generated with defaults', () => {
    const to = getDestinationLambda();
    const passthrough = new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination'
    });

    const template = cf.merge(passthrough, to);
    if (update) fixtures.update('hookshot-passthrough', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-passthrough')));
  });

  test('expected resources generated with alarm config', () => {
    const to = getDestinationLambda();
    const passthrough = new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      AlarmActions: ['devnull@mapbox.com']
    });

    const template = cf.merge(passthrough, to);
    if (update) fixtures.update('hookshot-passthrough-alarms', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-passthrough-alarms')));
  });

  test('expected resources generated with configured LoggingLevel', () => {
    const to = getDestinationLambda();
    const passthrough = new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      LoggingLevel: 'INFO'
    });

    const template = cf.merge(passthrough, to);
    if (update) fixtures.update('hookshot-passthrough-logging', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-passthrough-logging')));
  });

  test('expected resources generated with detailed logging and metrics', () => {
    const to = getDestinationLambda();
    const passthrough = new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      DataTraceEnabled: true,
      MetricsEnabled: true
    });

    const template = cf.merge(passthrough, to);
    if (update) fixtures.update('hookshot-passthrough-enhanced-logging', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-passthrough-enhanced-logging')));
  });

  test('LoggingLevel respected with detailed logging and metrics', () => {
    const to = getDestinationLambda();
    const passthrough = new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      DataTraceEnabled: true,
      MetricsEnabled: true,
      LoggingLevel: 'INFO'
    });

    const template = cf.merge(passthrough, to);
    if (update) fixtures.update('hookshot-passthrough-full-blown-logging', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-passthrough-full-blown-logging')));
  });

  test('expected resources generated with access logs', () => {
    const to = getDestinationLambda();
    const passthrough = new cf.shortcuts.hookshot.Passthrough({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      AccessLogFormat: '{ "requestId":"$context.requestId" }'
    });

    const template = cf.merge(passthrough, to);
    if (update) fixtures.update('hookshot-passthrough-access-log-format', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-passthrough-access-log-format')));
  });
});

describe('[shortcuts] hookshot github', () => {
  test('throws without required parameters', () => {
    expect(() => new cf.shortcuts.hookshot.Github()).toThrow(/You must provide a Prefix, and PassthroughTo/);
  });

  test('throws with invalid lambda Runtime python3.7', () => {
    expect(() => new cf.shortcuts.hookshot.Github({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      Runtime: 'python3.7'
    })).toThrow(/Only valid nodejs runtimes are supported for hookshot lambdas, received: 'python3.7'/);
  });

  test('throws with invalid lambda Runtime nodejs16.x', () => {
    expect(() => new cf.shortcuts.hookshot.Github({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      Runtime: 'nodejs16.x'
    })).toThrow(/Only nodejs runtimes >= 18 are supported for hookshot lambdas, received: 'nodejs16.x'/);
  });

  const getDestinationLambda = () => new cf.shortcuts.Lambda({
    LogicalName: 'Destination',
    Code: {
      ZipFile: 'module.exports.handler = (e, c, cb) => cb();'
    }
  });

  test('expected resources generated with defaults', () => {
    const to = getDestinationLambda();
    const github = new cf.shortcuts.hookshot.Github({
      Prefix: 'Pass',
      PassthroughTo: 'Destination'
    });

    const template = cf.merge(github, to);
    if (update) fixtures.update('hookshot-github', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-github')));
  });

  test('expected resources generated when secret passed as string', () => {
    const to = getDestinationLambda();
    const github = new cf.shortcuts.hookshot.Github({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      WebhookSecret: 'abc123'
    });

    const template = cf.merge(github, to);
    if (update) fixtures.update('hookshot-github-secret-string', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-github-secret-string')));
  });

  test('expected resources generated when secret passed as ref', () => {
    const to = getDestinationLambda();
    const github = new cf.shortcuts.hookshot.Github({
      Prefix: 'Pass',
      PassthroughTo: 'Destination',
      WebhookSecret: cf.ref('SomeParameter')
    });
    const Parameters = { SomeParameter: { Type: 'String' } };
    const template = cf.merge(github, to, { Parameters });
    if (update) fixtures.update('hookshot-github-secret-ref', template);
    expect(normalizeDeployment(noUndefined(template))).toEqual(normalizeDeployment(fixtures.get('hookshot-github-secret-ref')));
  });
});
