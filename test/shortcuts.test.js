'use strict';

const path = require('path');
const fs = require('fs');
const test = require('tape');
const cf = require('..');
const fixtures = require('./fixtures/shortcuts');

const update = !!process.env.UPDATE;

const noUndefined = (template) => JSON.parse(JSON.stringify(template));

test('[shortcuts] fixture validation', async (assert) => {
  const validations = fs.readdirSync(path.join(__dirname, 'fixtures', 'shortcuts'))
    .filter((filename) => path.extname(filename) === '.json')
    .map((filename) => {
      return cf.validate(path.join(__dirname, 'fixtures', 'shortcuts', filename))
        .catch(() => assert.fail(`${filename} fixture fails validation`))
        .then(() => assert.pass(`${filename} fixture passed validation`));
    });

  try {
    await Promise.all(validations);
  } catch (err) {
    assert.ifError(err, 'test failure');
  }

  assert.end();
});

test('[shortcuts] lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.Lambda(),
    /You must provide a LogicalName, and Code/,
    'throws without required parameters'
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
    DeadLetterConfig: { TargetArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake' },
    Description: 'my description',
    Environment:  { Variables: { A: 'a' } },
    FunctionName: 'my-function',
    Handler: 'index.something',
    KmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/fake',
    MemorySize: 512,
    ReservedConcurrencyExecutions: 10,
    Runtime: 'nodejs6.10',
    Tags: [{ Key: 'a', Value: 'b' }],
    Timeout: 30,
    TracingConfig: { Mode: 'Active' },
    VpcConfig: {
      SecurityGroupIds: ['sg-12345'],
      SubnetIds: ['fake']
    },
    Condition: 'Always',
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
    OKActions: ['devnull@mapbox.com']
  });

  template = cf.merge({
    Conditions: {
      Always: cf.equals('1', '1')
    }
  }, lambda);
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
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () => new cf.shortcuts.QueueLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    }),
    /You must provide an EventSourceArn and ReservedConcurrencyExecutions/,
    'throws without queue-lambda required parameters'
  );

  const lambda = new cf.shortcuts.QueueLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake',
    ReservedConcurrencyExecutions: 10
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
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () => new cf.shortcuts.ScheduledLambda({
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

test('[shortcuts] stream-lambda', (assert) => {
  assert.throws(
    () => new cf.shortcuts.StreamLambda(),
    /You must provide a LogicalName, and Code/,
    'throws without basic lambda required parameters'
  );

  assert.throws(
    () => new cf.shortcuts.StreamLambda({
      LogicalName: 'MyLambda',
      Code: {
        S3Bucket: 'my-code-bucket',
        S3Key: 'path/to/code.zip'
      }
    }),
    /You must provide an EventSourceArn/,
    'throws without stream-lambda required parameters'
  );

  const lambda = new cf.shortcuts.StreamLambda({
    LogicalName: 'MyLambda',
    Code: {
      S3Bucket: 'my-code-bucket',
      S3Key: 'path/to/code.zip'
    },
    EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:queue/fake'
  });

  const template = cf.merge(lambda);
  if (update) fixtures.update('stream-lambda', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('stream-lambda'),
    'expected resources generated'
  );

  assert.end();
});

test('[shortcuts] queue', (assert) => {
  assert.throws(
    () => new cf.shortcuts.Queue(),
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
    ContentBasedDeduplication: true,
    DelaySeconds: 60,
    FifoQueue: true,
    KmsMasterKeyId: 'alias/my-key',
    KmsDataKeyReusePeriondSeconds: 86400,
    MaximumMessageSize: 1024,
    MessageRetentionPeriod: 60,
    QueueName: 'my-queue',
    ReceiveMessageWaitTimeSeconds: 20,
    Condition: 'Always',
    TopicName: 'my-topic',
    DisplayName: 'topic-display-name',
    DeadLetterVisibilityTimeout: 60
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
    queue
  );
  if (update) fixtures.update('queue-full', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('queue-full'),
    'expected resources generated no defaults'
  );

  assert.end();
});

test('[shortcuts]', (assert) => {
  assert.throws(
    () => new cf.shortcuts.ServiceRole(),
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
  if (update) fixtures.update('service-role-suffix-replace', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('service-role-suffix-replace'),
    'expected resources generated, region-specific service suffix replaced'
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
    ManagedPolicyArns: [
      'arn:aws:iam::123456789012:policy/fake'
    ],
    MaxSessionDuration: 60,
    Path: '/fake',
    RoleName: 'my-role',
    Condition: 'Always'
  });

  template = cf.merge(
    { Conditions: { Always: cf.equals('1', '1') } },
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
