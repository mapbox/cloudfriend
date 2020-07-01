'use strict';

const Role = require('./role');

/**
 * Create an IAM role that will be assumed from another AWS Account.
 *
 * @param {Object} options - Extends
 * the options for [`Role`](#role). You do not need to provide
 * an `AssumeRolePrincipals` attribute, but do need to include the following
 * additional attributes:
 * @param {Array<String|Object>} options.Accounts - An array of accounts that can
 * assume this IAM Role. These could be account IDs (`123456789012`),
 * account ARNs (`arn:aws:iam::123456789012:root`), or CloudFormation intrinsic
 * function objects (`cf.sub('arn:aws:iam::${AccountIdParameter}:root')`).
 *
 * @example
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const role = new cf.shortcuts.CrossAccountRole({
 *   LogicalName: 'MyRole',
 *   Accounts: ['123456789012'],
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
class CrossAccountRole extends Role {
  constructor(options) {
    if (!options) throw new Error('Options required');
    const { LogicalName, Accounts } = options;

    const required = [LogicalName, Accounts];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a LogicalName and Accounts');

    const AssumeRolePrincipals = [{ AWS: Accounts }];
    super(Object.assign({ AssumeRolePrincipals }, options));
  }
}

module.exports = CrossAccountRole;
