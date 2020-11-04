'use strict';

const assert = require('assert');

/**
 * Merges two or more templates together into one.
 *
 * @static
 * @ignore
 * @memberof cloudfriend
 * @name merge
 * @param {...object} template - a CloudFormation template to merge with
 * @returns {object} a CloudFormation template including all the Metadata,
 * Parameters, Mappings, Conditions, Resources, and Outputs from the input
 * templates
 * @throws errors when there is overlap in logical resource names between
 * templates
 */
module.exports = function() {
  // This should capture all the top-level keys described in
  // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Metadata: {},
    Parameters: {},
    Mappings: {},
    Conditions: {},
    Resources: {},
    Outputs: {},
    // An empty array is rejected by CFN validation.
    Transform: undefined
  };

  const names = {
    Metadata: new Set(),
    Parameters: new Set(),
    Mappings: new Set(),
    Conditions: new Set(),
    Resources: new Set(),
    Outputs: new Set(),
    Transform: new Set()
  };

  for (const arg of arguments) {
    if (arg.Metadata) Object.keys(arg.Metadata).forEach((key) => {
      if (names.Metadata.has(key)) {
        try { assert.deepEqual(template.Metadata[key], arg.Metadata[key]); }
        catch (err) { throw new Error('Metadata name used more than once: ' + key); }
      }

      template.Metadata[key] = arg.Metadata[key];
      names.Metadata.add(key);
    });

    if (arg.Parameters) Object.keys(arg.Parameters).forEach((key) => {
      if (names.Parameters.has(key)) {
        try { assert.deepEqual(template.Parameters[key], arg.Parameters[key]); }
        catch (err) { throw new Error('Parameters name used more than once: ' + key); }
      }

      template.Parameters[key] = arg.Parameters[key];
      names.Parameters.add(key);
    });

    if (arg.Mappings) Object.keys(arg.Mappings).forEach((key) => {
      if (names.Mappings.has(key)) {
        try { assert.deepEqual(template.Mappings[key], arg.Mappings[key]); }
        catch (err) { throw new Error('Mappings name used more than once: ' + key); }
      }

      template.Mappings[key] = arg.Mappings[key];
      names.Mappings.add(key);
    });

    if (arg.Conditions) Object.keys(arg.Conditions).forEach((key) => {
      if (names.Conditions.has(key)) {
        try { assert.deepEqual(template.Conditions[key], arg.Conditions[key]); }
        catch (err) { throw new Error('Conditions name used more than once: ' + key); }
      }

      template.Conditions[key] = arg.Conditions[key];
      names.Conditions.add(key);
    });

    if (arg.Resources) Object.keys(arg.Resources).forEach((key) => {
      if (names.Resources.has(key)) {
        try { assert.deepEqual(template.Resources[key], arg.Resources[key]); }
        catch (err) { throw new Error('Resources name used more than once: ' + key); }
      }

      template.Resources[key] = arg.Resources[key];
      names.Resources.add(key);
    });

    if (arg.Outputs) Object.keys(arg.Outputs).forEach((key) => {
      if (names.Outputs.has(key)) {
        try { assert.deepEqual(template.Outputs[key], arg.Outputs[key]); }
        catch (err) { throw new Error('Outputs name used more than once: ' + key); }
      }

      template.Outputs[key] = arg.Outputs[key];
      names.Outputs.add(key);
    });

    if (arg.Transform) {
      template.Transform = [];
      const transforms = typeof arg.Transform === 'string' ? [arg.Transform] : arg.Transform;
      for (const transform of transforms) {
        if (names.Transform.has(transform)) {
          throw new Error('Transform macro used more than once: ' + transform);
        }
        template.Transform.push(transform);
        names.Transform.add(transform);
      }
    }
  }

  return template;
};
