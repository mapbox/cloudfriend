'use strict';

const Lambda = require('./lambda');

class StreamLambda extends Lambda {
  constructor(
    LogicalName,
    Code,
    Handler,
    EventSourceArn,
    LambdaProperties,
    AdditionalOptions
  ) {
    super(LogicalName, Code, Handler, LambdaProperties, AdditionalOptions);

    const required = [EventSourceArn];
    if (required.some((variable) => !variable))
      throw new Error('You must provide an EventSourceArn');

    const {
      BatchSize = 1,
      Enabled = true,
      StartingPosition = 'LATEST'
    } = AdditionalOptions;

    this.Resources[`${this.LogicalName}EventSource`] = {
      Type: 'AWS::Lambda::EventSourceMapping',
      Condition: this.Condition,
      Properties: {
        BatchSize,
        Enabled,
        EventSourceArn,
        FunctionName: this.FunctionName,
        StartingPosition
      }
    };

    this.Resources[`${LogicalName}Role`]
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
          { 'Fn:Sub': ['${arn}/*', { arn: EventSourceArn }] }
        ]
      });
  }
}

module.exports = StreamLambda;
