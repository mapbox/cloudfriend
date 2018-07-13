'use strict';

const AWS = require('aws-sdk');
const build = require('./build');

/**
 * Validates a template.
 *
 * @static
 * @memberof cloudfriend
 * @name validate
 * @param {string} templatePath - the filesystem path to a JSON or JS template.
 * @param {string} [region=us-east-1] - the region in which to validate the template.
 * @returns {promise} a promise that will resolve if the template is valid, or
 * reject if it is not.
 */
module.exports = (templatePath, region) => {
  const cfn = new AWS.CloudFormation({ region: region || 'us-east-1' });

  return build(templatePath).then((template) => {
    return cfn.validateTemplate({ TemplateBody: JSON.stringify(template) }).promise();
  });
};
