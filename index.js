var intrinsic = require('./lib/intrinsic');
var conditions = require('./lib/conditions');
var pseudo = require('./lib/pseudo');
var build = require('./lib/build');
var validate = require('./lib/validate');
var merge = require('./lib/merge');

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
