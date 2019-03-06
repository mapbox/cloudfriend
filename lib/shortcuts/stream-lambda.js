'use strict';

const Lambda = require('./lambda');

/**
 * @typedef { import('./lambda').LambdaOptions } LambdaOptions
 * @typedef {object} StreamLambdaOptions
 * @property {string} EventSourceArn See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-eventsourcearn)
 * @property {number} [BatchSize=1] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-batchsize)
 * @property {boolean} [Enabled=true] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-enabled)
 * @property {string} [StartingPosition='LATEST'] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-eventsourcemapping.html#cfn-lambda-eventsourcemapping-startingposition)
 */

/**
 * A Lambda function that executes in response to events in a DynamoDB or Kinesis
 * stream. Includes a LogGroup, a Role, an Alarm on function errors, and an event
 * source mapping.
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
  /**
   * @param {StreamLambdaOptions & LambdaOptions} options configuration options for the scheduled Lambda
   * function and related resources. Extends [the `options` for a vanilla Lambda
   * function](#parameters) with the following additional attributes:
   */
  constructor(options) {
    super(options);

    const {
      EventSourceArn,
      BatchSize = 1,
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
