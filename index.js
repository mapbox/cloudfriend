var intrinsic = require('./lib/intrinsic');
var conditions = require('./lib/conditions');
var pseudo = require('./lib/pseudo');
var build = require('./lib/build');
var validate = require('./lib/validate');
var merge = require('./lib/merge');
var Dereferencer = require('./lib/dereferencer');

/**
 * The cloudfriend module
 *
 * @example
 * var cloudfriend = require('cloudfriend');
 */
var cloudfriend = module.exports = {
  build: build,
  validate: validate,
  merge: merge
};

Object.keys(intrinsic).forEach(function(key) {
  cloudfriend[key] = intrinsic[key];
});

Object.keys(conditions).forEach(function(key) {
  cloudfriend[key] = conditions[key];
});

Object.keys(pseudo).forEach(function(key) {
  cloudfriend[key] = pseudo[key];
});

cloudfriend.permissions = {
  AWSTemplateFormatVersion: '2010-09-09',
  Resources: {
    User: {
      Type: 'AWS::IAM::User',
      Properties: {
        Policies: [
          {
            PolicyName: 'validate-templates',
            PolicyDocument: {
              Statement: [
                {
                  Action: 'cloudformation:ValidateTemplate',
                  Effect: 'Allow',
                  Resource: '*'
                }
              ]
            }
          }
        ]
      }
    },
    AccessKey: {
      Type: 'AWS::IAM::AccessKey',
      Properties: {
        UserName: cloudfriend.ref('User')
      }
    }
  },
  Outputs: {
    AccessKeyId: { Value: cloudfriend.ref('AccessKey') },
    SecretAccessKey: { Value: cloudfriend.getAtt('AccessKey', 'SecretAccessKey') }
  }
};

/**
 * Attempt to dereference the conditions, intrinsic functions, and pseudo
 * parameters in a CloudFormation template. The result is a template that has
 * resolved these parts of the template into flat strings.
 *
 * NOTE: A dereferenced template is **not deployable**. Upon real deployment,
 * several resources are given unique names by CloudFormation. This code cannot
 * select the appropriate random strings and UUIDs that CloudFormation generates.
 *
 * @param {object} template - the CloudFormation template as a JS object
 * @param {object} parameters - key-value mapping providing the values for each
 * of the template's parameters
 * @param {object} options - Simulated CloudFormation deployment options
 * @param {string} options.region - the region the stack would be deployed into
 * @param {string} options.stackName - the stack's name
 * @param {string} options.accountId - the AWS account the stack would be
 * deployed into
 * @returns {object} the template with as many conditions, intrinsic functions,
 * and pseudo-parameters resolved into flat strings as possible.
 */
cloudfriend.dereference = function(template, parameters, options) {
  var dereferencer = new Dereferencer(template);
  return dereferencer.deploy(options, parameters);
};
