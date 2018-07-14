'use strict';

const Lambda = require('./lambda');

class QueueLambda extends Lambda {
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
      Enabled = true
    } = AdditionalOptions;

    this.Resources[`${this.LogicalName}EventSource`] = {
      Type: 'AWS::Lambda::EventSourceMapping',
      Condition: this.Condition,
      Properties: {
        Enabled,
        EventSourceArn,
        FunctionName: this.FunctionName
      }
    };

    this.Resources[`${LogicalName}Role`]
      .Properties.Policies[0].PolicyDocument.Statement.push({
        Effect: 'Allow',
        Action: [
          'sqs:DeleteMessage',
          'sqs:ReceiveMessage'
        ],
        Resource: [
          EventSourceArn,
          { 'Fn:Sub': ['${arn}/*', { arn: EventSourceArn }] }
        ]
      });
  }
}

module.exports = QueueLambda;
