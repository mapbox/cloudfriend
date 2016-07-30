
/**
 * Build the provided template. Works for static templates, templates that are
 * functions requiring no arguments, and templates that accept a callback function.
 *
 * @static
 * @memberof cloudfriend
 * @name build
 * @param {string} templatePath - the filesystem path to a JSON or JS template.
 * @returns {promise} a promise that will resolve with the template's body.
 */
module.exports = (templatePath) => {
  var template = require(templatePath);

  return new Promise((resolve, reject) => {
    if (typeof template !== 'function')
      return resolve(JSON.stringify(template, null, 4));

    var resolved = template((err, data) => {
      if (err) return reject(err);
      resolve(JSON.stringify(data, null, 4));
    });

    if (resolved) return resolve(JSON.stringify(resolved, null, 4));
  });
};
