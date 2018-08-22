'use strict';

/**
 * Creates an SQS queue that can be fed messages through an SNS topic. Creates
 * an SQS queue, SNS topic, dead-letter queue and policy allowing SNS events
 * to publish messages to the queue.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the SQS queue and related
 * resources.
 * @param {String} options.LogicalName the logical name of the SQS queue
 * within the CloudFormation template. This is also used to construct the logical
 * names of the other resources.
 * @param {Number} [options.VisibilityTimeout=300] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-visibilitytimeout)
 * @param {Number} [options.maxReceiveCount=10] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues-redrivepolicy.html#aws-sqs-queue-redrivepolicy-maxcount)
 * @param {Boolean} [options.ContentBasedDeduplication=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#cfn-sqs-queue-contentbaseddeduplication)
 * @param {Number} [options.DelaySeconds=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-delayseconds)
 * @param {Boolean} [options.FifoQueue=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#cfn-sqs-queue-fifoqueue)
 * @param {String} [options.KmsMasterKeyId=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-kmsmasterkeyid)
 * @param {Number} [options.KmsDataKeyReusePeriodSeconds=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-kmsdatakeyreuseperiodseconds)
 * @param {Number} [options.MaximumMessageSize=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-maxmsgsize)
 * @param {Number} [options.MessageRetentionPeriod=1209600] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-msgretentionperiod)
 * @param {String} [options.QueueName='${stack name}-${logical name}'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-name)
 * @param {Number} [options.ReceiveMessageWaitTimeSeconds=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-receivemsgwaittime)
 * @param {String} [options.Condition=undefined] if there is a Condition defined
 * in the template that should control whether or not to create this SQS queue,
 * specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html)
 * @param {String} [options.DependsOn=undefined] Specify a stack resource dependency
 * to this SQS queue. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html)
 * @param {String} [options.TopicName='${stack name}-${logical name}'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sns-topic.html#cfn-sns-topic-name)
 * @param {String} [options.DisplayName=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sns-topic.html#cfn-sns-topic-displayname)
 * @param {Number} [options.DeadLetterVisibilityTimeout=300] [VisibilityTimeout](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html#aws-sqs-queue-visibilitytimeout) for the dead-letter queue
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const queue = new cf.shortcuts.Queue({
 *   LogicalName: 'MyQueue'
 * });
 *
 * module.exports = cf.merge(myTemplate, queue);
 */
class Queue {
  constructor(options = {}) {
    const {
      LogicalName,
      VisibilityTimeout = 300,
      maxReceiveCount = 10,
      ContentBasedDeduplication,
      DelaySeconds,
      FifoQueue,
      KmsMasterKeyId,
      KmsDataKeyReusePeriodSeconds,
      MaximumMessageSize,
      MessageRetentionPeriod = 1209600,
      QueueName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      ReceiveMessageWaitTimeSeconds,
      Condition = undefined,
      DependsOn = undefined,
      TopicName = { 'Fn::Sub': `\${AWS::StackName}-${LogicalName}` },
      DisplayName,
      DeadLetterVisibilityTimeout = 300
    } = options;

    const required = [LogicalName];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName');

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::SQS::Queue',
        Condition,
        DependsOn,
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
          Subscription: [
            {
              Endpoint: { 'Fn::GetAtt': [LogicalName, 'Arn'] },
              Protocol: 'sqs'
            }
          ]
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
