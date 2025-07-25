'use strict';

const { CloudFormationClient, ValidateTemplateCommand } = require('@aws-sdk/client-cloudformation');
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
  const cfn = new CloudFormationClient({ region: region || 'us-east-1' });

  return build(templatePath, { region: region || 'us-east-1' }).then((template) => {
    return cfn.send(new ValidateTemplateCommand({ TemplateBody: JSON.stringify(template) }));
  });
};
