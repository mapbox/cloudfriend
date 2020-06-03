'use strict';

const Lambda = require('./lambda');

/**
 * A Lambda function that runs in response to events in a DynamoDB or Kinesis
 * stream. Includes a Log Group, a Role, an Alarm on function errors, and an event
 * source mapping.
 *
 * @param {Object} options - Extends the options for [`Lambda`](#lambda) with the following additional attributes:
 * @param {String} options.EventSourceArn - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-eventsourcearn).
 * @param {Number} [options.BatchSize=1] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-batchsize).
 * @param {Number} [options.MaximumBatchingWindowInSeconds=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-maximumbatchingwindowinseconds).
 * @param {Boolean} [options.Enabled=true] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-enabled).
 * @param {String} [options.StartingPosition='LATEST'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-startingposition).
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const lambda = new cf.shortcuts.StreamLambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   },
 *   EventSourceArn: cf.getAtt('MyStream', 'Arn')
 * });
 *
 * module.exports = cf.merge(myTemplate, lambda);
 */
class StreamLambda extends Lambda {
  constructor(options) {
    super(options);

    const {
      EventSourceArn,
      BatchSize = 1,
      MaximumBatchingWindowInSeconds,
      Enabled = true,
      StartingPosition = 'LATEST'
    } = options;

    const required = [EventSourceArn];
    if (required.some((variable) => !variable))
      throw new Error('You must provide an EventSourceArn');

    this.Resources[`${this.LogicalName}EventSource`] = {
      Type: 'AWS::Lambda::EventSourceMapping',
      Condition: this.Condition,
      Properties: {
        BatchSize,
        MaximumBatchingWindowInSeconds,
        Enabled,
        EventSourceArn,
        FunctionName: { Ref: this.LogicalName },
        StartingPosition
      }
    };

    this.Resources[`${this.LogicalName}Role`]
      .Properties.Policies[0].PolicyDocument.Statement.push({
        Effect: 'Allow',
        Action: [
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:DescribeStream',
          'dynamodb:ListStreams',
          'kinesis:GetRecords',
          'kinesis:GetShardIterator',
          'kinesis:DescribeStream',
          'kinesis:ListStreams'
        ],
        Resource: [
          EventSourceArn,
          { 'Fn::Sub': ['${arn}/*', { arn: EventSourceArn }] }
        ]
      });
  }
}

module.exports = StreamLambda;
