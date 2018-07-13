'use strict';

const Lambda = require('./lambda');

class ScheduledLambda extends Lambda {
  constructor(
    LogicalName,
    Code,
    Handler,
    ScheduleExpression,
    LambdaProperties,
    AdditionalOptions
  ) {
    super(LogicalName, Code, Handler, LambdaProperties, AdditionalOptions);

    const required = [ScheduleExpression];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a ScheduleExpression');

    this.Resources[`${this.LogicalName}Schedule`] = {
      Type: 'AWS::Events::Rule',
      Condition: this.Condition,
      Properties: {
        Name: this.FunctionName,
        Description: {
          'Fn::Sub': [
            'Schedule for ${function} in ${AWS::StackName} stack',
            { function: this.FunctionName }
          ]
        },
        ScheduleExpression,
        Targets: [
          {
            Id: this.FunctionName,
            Arn: {
              'Fn::GetAtt': [this.LogicalName, 'Arn']
            }
          }
        ]
      }
    };

    this.Resources[`${this.LogicalName}Permission`] = {
      Type: 'AWS::Lambda::Permission',
      Condition: this.Condition,
      Properties: {
        Action: 'lambda:InvokeFunction',
        FunctionName: {
          'Fn::GetAtt': [this.LogicalName, 'Arn']
        },
        Principal: {
          'Fn::Sub': 'events.${AWS::URLSuffix}'
        },
        SourceArn: {
          'Fn::GetAtt': [`${this.LogicalName}Schedule`, 'Arn']
        }
      }
    };
  }
}

module.exports = ScheduledLambda;
