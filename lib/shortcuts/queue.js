'use strict';

class Queue {
  constructor(
    LogicalName,
    VisibilityTimeout = 300,
    maxReceiveCount = 10,
    QueueProperties = {},
    AdditionalOptions = {}
  ) {
    const required = [LogicalName];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName');

    const {
      ContentBasedDeduplication,
      DelaySeconds,
      FifoQueue,
      KmsMasterKeyId,
      KmsDataKeyReusePeriodSeconds,
      MaximumMessageSize,
      MessageRetentionPeriod = 1209600,
      QueueName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      ReceiveMessageWaitTimeSeconds
    } = QueueProperties;

    const {
      Condition = undefined,
      TopicName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      DisplayName,
      DeadLetterVisibilityTimeout = 300
    } = AdditionalOptions;

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::SQS::Queue',
        Condition,
        Properties: {
          ContentBasedDeduplication,
          DelaySeconds,
          FifoQueue,
          KmsMasterKeyId,
          KmsDataKeyReusePeriodSeconds,
          MaximumMessageSize,
          MessageRetentionPeriod,
          QueueName,
          ReceiveMessageWaitTimeSeconds,
          RedrivePolicy: {
            maxReceiveCount,
            deadLetterTargetArn: {
              'Fn::GetAtt': [`${LogicalName}DeadLetter`, 'Arn']
            }
          },
          VisibilityTimeout
        }
      },

      [`${LogicalName}DeadLetter`]: {
        Type: 'AWS::SQS::Queue',
        Condition,
        Properties: {
          MessageRetentionPeriod: 1209600,
          VisibilityTimeout: DeadLetterVisibilityTimeout,
          QueueName: {
            'Fn::Sub': ['${queue}-dead-letter', { queue: QueueName }]
          }
        }
      },

      [`${LogicalName}Topic`]: {
        Type: 'AWS::SNS::Topic',
        Condition,
        Properties: {
          TopicName,
          DisplayName,
          Subscription: {
            Endpoint: { 'Fn::GetAtt': [LogicalName, 'Arn'] },
            Protocol: 'sqs'
          }
        }
      },

      [`${LogicalName}Policy`]: {
        Type: 'AWS::SQS::QueuePolicy',
        Condition,
        Properties: {
          Queues: [{ Ref: LogicalName }],
          PolicyDocument: {
            Version: '2008-10-17',
            Id: LogicalName,
            Statement: [
              {
                Sid: LogicalName,
                Effect: 'Allow',
                Action: 'sqs:SendMessage',
                Principal: { AWS: '*' },
                Resource: { 'Fn::GetAtt': [LogicalName, 'Arn'] },
                Condition: {
                  ArnEquals: {
                    'aws:SourceArn': { Ref: `${LogicalName}Topic` }
                  }
                }
              }
            ]
          }
        }
      }
    };
  }
}

module.exports = Queue;
