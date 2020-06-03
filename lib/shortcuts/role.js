'use strict';

/**
 * Create an IAM role.
 *
 * @param {Object} options - Options.
 * @param {String} options.LogicalName - The logical name of the IAM role
 * within the CloudFormation template.
 * @param {Array<Object>} options.AssumeRolePrincipals - An array of [principal objects](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html)
 * defining entities able to assume this role. Will be included in the role's
 * [`AssumeRolePolicyDocument`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html?shortFooter=true#cfn-iam-role-assumerolepolicydocument).
 * @param {Array<Object>} [options.Statement=[]] - An array of permissions statements
 * to be included in the [`PolicyDocument`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-iam-policy.html#cfn-iam-policies-policydocument).
 * @param {Array<String>} [options.ManagedPolicyArns=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-managepolicyarns).
 * @param {Number} [options.MaxSessionDuration=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-maxsessionduration).
 * @param {String} [options.Path=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-path).
 * @param {String} [options.RoleName=undefined] - See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-rolename).
 * @param {String} [options.Condition=undefined] -I f there is a `Condition` defined
 * in the template that should control whether to create this IAM role,
 * specify the name of the condition here. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html).
 * @param {String} [options.DependsOn=undefined] - Specify a stack resource dependency
 * to this IAM role. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html).
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const role = new cf.shortcuts.Role({
 *   LogicalName: 'MyRole',
 *   AssumeRolePrincipals: [
 *     { Service: 'ec2.amazonaws.com' }
 *   ],
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
class Role {
  constructor(options = {}) {
    const {
      LogicalName,
      AssumeRolePrincipals,
      Statement = [],
      ManagedPolicyArns,
      MaxSessionDuration,
      Path,
      RoleName,
      Condition = undefined,
      DependsOn = undefined
    } = options;

    const required = [LogicalName, AssumeRolePrincipals];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName and AssumeRolePrincipals');

    this.Resources = {
      [LogicalName]: {
        Type: 'AWS::IAM::Role',
        Condition,
        DependsOn,
        Properties: {
          ManagedPolicyArns,
          MaxSessionDuration,
          Path,
          RoleName,
          AssumeRolePolicyDocument: {
            Statement: AssumeRolePrincipals.map((Principal) => ({
              Effect: 'Allow',
              Action: 'sts:AssumeRole',
              Principal
            }))
          }
        }
      }
    };

    if (Statement.length) this.Resources[LogicalName].Properties.Policies = [
      {
        PolicyName: 'main',
        PolicyDocument: {
          Statement
        }
      }
    ];
  }
}

module.exports = Role;
