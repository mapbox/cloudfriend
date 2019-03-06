'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Build the provided template. Works for static templates, templates that are
 * functions requiring no arguments, and templates that accept a callback function.
 *
 * @static
 * @memberof cloudfriend
 * @name build
 * @param {string} templatePath - the filesystem path to a JSON or JS template.
 * @param {object} [templateOptions] - an object to pass to a JS template function
 * as the first argument.
 * @returns {Promise<string>} a promise that will resolve with the template's body.
 */
module.exports = (templatePath, templateOptions) => {
  templatePath = path.resolve(templatePath);

  /**
   * @type {string|object}
   */
  let template;

  if (!/\.js$/.test(templatePath)) {
    template = fs.readFileSync(templatePath, { encoding: 'utf8' });
    try { template = JSON.parse(template); }
    catch (err) { return Promise.reject(err); }
    return Promise.resolve(template);
  }

  template = require(templatePath);
  return new Promise((resolve, reject) => {
    if (typeof template !== 'function') return resolve(template);

    /**
     * @param {Error} err
     * @param {string} data
     */
    function finished(err, data) {
      if (err) return reject(err);
      resolve(data);
    }

    const args = [finished];
    if (templateOptions) args.unshift(templateOptions);

    const resolved = template.apply(null, args);
    if (resolved) return resolve(resolved);
  });
};
