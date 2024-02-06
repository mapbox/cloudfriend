'use strict';

const Lambda = require('./lambda');

/**
 * A Lambda function that runs in reaction to a CloudWatch Event. Includes
 * a LogGroup, a Role, an Alarm on function errors, a CloudWatch Event Rule, and
 * a Lambda permission.
 *
 * @param {Object} options - Extends the options for [`Lambda`](#lambda)
 * with the following additional attributes:
 * @param {String} options.EventPattern - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-eventpattern).
 * @param {String} [options.State='ENABLED'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-state).
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const lambda = new cf.shortcuts.EventLambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   },
 *   EventPattern: {
 *     'detail-type': ['AWS Console Sign In via CloudTrail'],
 *     detail: {
 *       eventSource: ['signin.amazonaws.com'],
 *       eventName: ['ConsoleLogin']
 *     }
 *   }
 * });
 *
 * module.exports = cf.merge(myTemplate, lambda);
 */
class EventLambda extends Lambda {
  constructor(options) {
    if (!options) throw new Error('Options required');
    super(options);

    const {
      EventPattern,
      State = 'ENABLED'
    } = options;

    const required = [EventPattern];
    if (required.some((variable) => !variable))
      throw new Error('You must provide an EventPattern');

    this.Resources[`${this.LogicalName}Trigger`] = {
      Type: 'AWS::Events::Rule',
      Condition: this.Condition,
      Properties: {
        Name: this.FunctionName,
        Description: {
          'Fn::Sub': [
            'Event trigger for ${function} in ${AWS::StackName} stack',
            { function: this.FunctionName }
          ]
        },
        State,
        EventPattern,
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
          'Fn::GetAtt': [`${this.LogicalName}Trigger`, 'Arn']
        }
      }
    };
  }
}

module.exports = EventLambda;
