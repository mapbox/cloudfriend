'use strict';

// eslint-disable-next-line node/no-missing-require
try { require('@mapbox/invisible-cloudfriend'); } catch (err) { true; }

const intrinsic = require('./lib/intrinsic');
const conditions = require('./lib/conditions');
const pseudo = require('./lib/pseudo');
const build = require('./lib/build');
const validate = require('./lib/validate');
const merge = require('./lib/merge');
const shortcuts = require('./lib/shortcuts');

/**
 * The cloudfriend module
 *
 * @example
 * var cloudfriend = require('cloudfriend');
 */
const cloudfriend = module.exports = {
  build,
  validate,
  merge,
  shortcuts
};

Object.keys(intrinsic).forEach((key) => {
  cloudfriend[key] = intrinsic[key];
});

Object.keys(conditions).forEach((key) => {
  cloudfriend[key] = conditions[key];
});

Object.keys(pseudo).forEach((key) => {
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
