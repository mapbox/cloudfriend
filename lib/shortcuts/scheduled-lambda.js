'use strict';

const Lambda = require('./lambda');
const merge = require('../merge');
const ServiceRole = require('./service-role');

/**
 * A Lambda function that runs on in response to a CloudWatch Event. Includes
 * a Log Group, a Role, an Alarm on function errors, a CloudWatch Event Rule, and
 * a Lambda permission.
 *
 * @param {Object} options - Extends the options for [`Lambda`](#lambda) with the following additional attributes:
 * @param {String} options.ScheduleExpression - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-scheduleexpression).
 * @param {String} [options.ScheduleRoleArn=undefined] If specified, the eventbridge scheduler schedule will use this role to invoke your lambda . If not specified a service role with the correct scoped permissions is created for you.
 * See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-scheduler-schedule-target.html#cfn-scheduler-schedule-target-rolearn)
 * @param {String} [options.ScheduleGroupName=undefined] - If specified, the eventbridge scheduler schedule is associated with this preexisting schedule group.
 * If not specified the schedule is associated with the default schedule group. Note you cannot change a schedule's schedule group once it has been already associated with a schedule group.
 * See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-scheduler-schedule.html#cfn-scheduler-schedule-groupname).
 * @param {String} [options.State='ENABLED'] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html#cfn-events-rule-state).
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * // A scheduler service role is already created for you internally with the correct permissions
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
 * const myTemplate = { ... };
 *
 * // If you are creating your own scheduler service role, be sure your permissions are correct!
 * const role = new cf.shortcuts.ServiceRole({
 *   LogicalName: 'MyRole',
 *   Service: 'scheduler.amazonaws.com',
 *   Statement: [
 *     {
 *       Effect: 'Allow',
 *       Action: 'lambda:InvokeFunction',
 *       Resource: cf.sub('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${AWS::StackName}-*')
 *     }
 *   ]
 * });
 *
 * const lambda = new cf.shortcuts.ScheduledLambda({
 *   LogicalName: 'MyLambda',
 *   Code: {
 *     S3Bucket: 'my-code-bucket',
 *     S3Key: 'path/to/code.zip'
 *   },
 *   ScheduleRoleArn: cf.getAtt('MyRole', 'Arn'),
 *   ScheduleExpression: 'rate(1 hour)',
 * });
 *
 * module.exports = cf.merge(myTemplate, role, lambda);
 */
class ScheduledLambda extends Lambda {
  constructor(options) {
    if (!options) throw new Error('Options required');
    super(options);

    const {
      ScheduleExpression,
      ScheduleRoleArn,
      ScheduleGroupName,
      State = 'ENABLED'
    } = options;

    const required = [ScheduleExpression];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a ScheduleExpression');

    this.Resources[`${this.LogicalName}Scheduler`] = {
      Type: 'AWS::Scheduler::Schedule',
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
        FlexibleTimeWindow: {
          Mode: 'OFF'
        },
        Target: {
          Arn: {
            'Fn::GetAtt': [this.LogicalName, 'Arn']
          }
        }
      }
    };

    if (ScheduleGroupName) {
      this.Resources[`${this.LogicalName}Scheduler`].Properties.GroupName = ScheduleGroupName;
    }

    if (ScheduleRoleArn) {
      this.Resources[`${this.LogicalName}Scheduler`].Properties.Target.RoleArn = ScheduleRoleArn;
    } else {
      const serviceRole = new ServiceRole({
        LogicalName: `${this.LogicalName}SchedulerRole`,
        Service: 'scheduler.amazonaws.com',
        Condition: this.Condition,
        Statement: [
          {
            Effect: 'Allow',
            Action: 'lambda:InvokeFunction',
            Resource: {
              'Fn::GetAtt': [this.LogicalName, 'Arn']
            }
          }
        ]
      });
      this.Resources[`${this.LogicalName}Scheduler`].Properties.Target.RoleArn = { 'Fn::GetAtt': [`${this.LogicalName}SchedulerRole`, 'Arn'] };
      this.Resources = merge(this, serviceRole).Resources;
    }
  }
}

module.exports = ScheduledLambda;
