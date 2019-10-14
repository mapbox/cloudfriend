'use strict';

const Lambda = require('./lambda');

/**
 * A Lambda function that executes in response to a subscription filter.
 * Includes a LogGroup, a Role, an Alarm on function errors, a CloudWatch Subscription Filter,
 * and a Lambda permission.
 *
 * @param {Object} options configuration options for the subscription filter Lambda
 * function and related resources. Extends [the `options` for a vanilla Lambda
 * function](#parameters) with the following additional attributes:
 * @param {String} [options.FilterPattern=''] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html#cfn-cwl-subscriptionfilter-filterpattern)
 * @param {String} options.LogGroupName See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html#cfn-cwl-subscriptionfilter-loggroupname)
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const lambda = new cf.shortcuts.SubscriptionFilterLambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   },
 *   LogGroupName: 'my-log-group'
 * });
 *
 * module.exports = cf.merge(myTemplate, lambda);
 */
class SubscriptionFilterLambda extends Lambda {
  constructor(options = {}) {
    super(options);
    const {
      FilterPattern = '',
      LogGroupName
    } = options;

    const required = [LogGroupName];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogGroupName');

    this.Resources = {
      [`${this.LogicalName}SubscriptionFilter`]: {
        Type: 'AWS::Logs::SubscriptionFilter',
        Condition: this.Condition,
        Properties: {
          DestinationArn: { 'Fn::GetAtt': [this.LogicalName, 'Arn'] },
          FilterPattern: FilterPattern,
          LogGroupName: LogGroupName
        }
      },
      [`${this.LogicalName}Permission`]: {
        Type: 'AWS::Lambda::Permission',
        Condition: this.Condition,
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName: {
            'Fn::GetAtt': [this.LogicalName, 'Arn']
          },
          Principal: {
            'Fn::Sub': 'logs.${AWS::URLSuffix}'
          },
          SourceArn: {
            'Fn::Sub': ['arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:${Name}:*', {
              Name: LogGroupName
            }]
          }
        }
      }
    };
  }
}

module.exports = SubscriptionFilterLambda;
