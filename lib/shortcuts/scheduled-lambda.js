'use strict';

const Lambda = require('./lambda');

/**
 * A Lambda function that runs on in response to a CloudWatch Event. Includes
 * a Log Group, a Role, an Alarm on function errors, a CloudWatch Event Rule, and
 * a Lambda permission.
 *
 * @param {Object} options - Extends the options for [`Lambda`](#lambda) with the following additional attributes:
 * @param {String} options.ScheduleExpression - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-scheduleexpression).
 * @param {String} [options.EventBusName='default'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-eventbusname).
 * @param {String} [options.State='ENABLED'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-state).
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const lambda = new cf.shortcuts.ScheduledLambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   },
 *   ScheduleExpression: 'cron(45 * * * ? *)',
 * });
 *
 * module.exports = cf.merge(myTemplate, lambda);
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = {
 *   ...
 *   Resources: {
 *     MyEventBus: {
 *       Type: 'AWS::Events::EventBus',
 *       Properties: { ... }
 *     }
 *   }
 * };
 *
 * const lambda = new cf.shortcuts.ScheduledLambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   },
 *   EventBusName: cf.ref('MyEventBus'),
 *   ScheduleExpression: 'cron(45 * * * ? *)',
 * });
 *
 * module.exports = cf.merge(myTemplate, lambda);
 *
 */
class ScheduledLambda extends Lambda {
  constructor(options) {
    if (!options) throw new Error('Options required');
    super(options);

    const {
      EventBusName,
      ScheduleExpression,
      State = 'ENABLED'
    } = options;

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
        State,
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

    if (EventBusName) {
      this.Resources[`${this.LogicalName}Schedule`].Properties.EventBusName = EventBusName;
    }

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
