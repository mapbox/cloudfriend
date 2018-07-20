'use strict';

/**
 * Create an IAM role that will be assumed by an AWS service, e.g. Lambda or ECS.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the IAM role.
 * @param {String} options.LogicalName the logical name of the IAM role
 * within the CloudFormation template.
 * @param {Array<Object>} [options.Statement=[]] an array of permissions statements
 * to be included in the [PolicyDocument](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-iam-policy.html#cfn-iam-policies-policydocument).
 * @param {Array<String>} [options.ManagedPolicyArns=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-managepolicyarns)
 * @param {Number} [options.MaxSessionDuration=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-maxsessionduration)
 * @param {String} [options.Path=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-path)
 * @param {String} [options.RoleName=undefined] See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-rolename)
 * @param {String} [options.Condition=undefined] if there is a Condition defined
 * in the template that should control whether or not to create this IAM role,
 * specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html)
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const role = new cf.shortcuts.ServiceRole({
 *   LogicalName: 'MyRole',
 *   Statement: [
 *     {
 *       Effect: 'Allow',
 *       Action: 's3:GetObject',
 *       Resource: 'arn:aws:s3:::my-bucket/my/data.tar.gz'
 *     }
 *   ]
 * });
 *
 * module.exports = cf.merge(myTemplate, role);
 */
class ServiceRole {
  constructor(options) {
    const {
      LogicalName,
      Statement = [],
      ManagedPolicyArns,
      MaxSessionDuration,
      Path,
      RoleName,
      Condition = undefined
    } = options;

    let { Service } = options;

    const required = [LogicalName, Service];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName and Service');

    Service = {
      'Fn::Sub': `${Service.replace(/\.amazonaws.com(\..*)?$/, '')}.\${AWS::URLSuffix}`
    };

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::IAM::Role',
        Condition,
        Properties: {
          ManagedPolicyArns,
          MaxSessionDuration,
          Path,
          RoleName,
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'sts:AssumeRole',
                Principal: { Service }
              }
            ]
          },
          Policies: [
            {
              PolicyName: 'main',
              PolicyDocument: {
                Statement
              }
            }
          ]
        }
      }
    };
  }
}

module.exports = ServiceRole;
