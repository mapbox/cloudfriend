'use strict';

const Lambda = require('./lambda');

/**
 * A Lambda function that executes in response to messages in an SQS queue.
 * Includes a LogGroup, a Role, an Alarm on function errors, and an event source
 * mapping.
 *
 * @param {Object} options configuration options for the scheduled Lambda
 * function and related resources. Extends [the `options` for a vanilla Lambda
 * function](#parameters) with the following additional attributes:
 * @param {String} options.EventSourceArn See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-eventsourcearn)
 * @param {Number} options.ReservedConcurrentExecutions See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions)
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const lambda = new cf.shortcuts.QueueLambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   },
 *   EventSourceArn: cf.getAtt('MyQueue', 'Arn'),
 *   ReservedConcurrentExecutions: 30
 * });
 *
 * module.exports = cf.merge(myTemplate, lambda);
 */
class QueueLambda extends Lambda {
  constructor(options = {}) {
    super(options);

    const { EventSourceArn, ReservedConcurrentExecutions } = options;

    const required = [EventSourceArn, ReservedConcurrentExecutions];
    if (required.some((variable) => !variable))
      throw new Error('You must provide an EventSourceArn and ReservedConcurrentExecutions');

    const { Enabled = true } = options;

    this.Resources[`${this.LogicalName}EventSource`] = {
      Type: 'AWS::Lambda::EventSourceMapping',
      Condition: this.Condition,
      Properties: {
        Enabled,
        EventSourceArn,
        FunctionName: { Ref: this.LogicalName }
      }
    };

    this.Resources[`${this.LogicalName}Role`]
      .Properties.Policies[0].PolicyDocument.Statement.push({
        Effect: 'Allow',
        Action: [
          'sqs:DeleteMessage',
          'sqs:ReceiveMessage',
          'sqs:GetQueueAttributes'
        ],
        Resource: [
          EventSourceArn,
          { 'Fn::Sub': ['${arn}/*', { arn: EventSourceArn }] }
        ]
      });
  }
}

module.exports = QueueLambda;
