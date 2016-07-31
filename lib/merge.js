
/**
 * Merges two or more templates together into one.
 *
 * @static
 * @memberof cloudfriend
 * @name merge
 * @param {object} template - a CloudFormation template to merge with
 * @returns {object} a CloudFormation template including all the Metadata,
 * Parameters, Mappings, Conditions, Resources, and Outputs from the input
 * templates
 * @throws errors when there is overlap in logical resource names between
 * templates
 */
module.exports = function() {
  var template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Metadata: {},
    Parameters: {},
    Mappings: {},
    Conditions: {},
    Resources: {},
    Outputs: {}
  };

  var names = new Set();

  for (var arg of arguments) {
    if (arg.Metadata) Object.keys(arg.Metadata).forEach((key) => {
      if (names.has(key)) throw new Error('LogicalName used more than once: ' + key);
      template.Metadata[key] = arg.Metadata[key];
      names.add(key);
    });

    if (arg.Parameters) Object.keys(arg.Parameters).forEach((key) => {
      if (names.has(key)) throw new Error('LogicalName used more than once: ' + key);
      template.Parameters[key] = arg.Parameters[key];
      names.add(key);
    });

    if (arg.Mappings) Object.keys(arg.Mappings).forEach((key) => {
      if (names.has(key)) throw new Error('LogicalName used more than once: ' + key);
      template.Mappings[key] = arg.Mappings[key];
      names.add(key);
    });

    if (arg.Conditions) Object.keys(arg.Conditions).forEach((key) => {
      if (names.has(key)) throw new Error('LogicalName used more than once: ' + key);
      template.Conditions[key] = arg.Conditions[key];
      names.add(key);
    });

    if (arg.Resources) Object.keys(arg.Resources).forEach((key) => {
      if (names.has(key)) throw new Error('LogicalName used more than once: ' + key);
      template.Resources[key] = arg.Resources[key];
      names.add(key);
    });

    if (arg.Outputs) Object.keys(arg.Outputs).forEach((key) => {
      if (names.has(key)) throw new Error('LogicalName used more than once: ' + key);
      template.Outputs[key] = arg.Outputs[key];
      names.add(key);
    });
  }

  return template;
};
