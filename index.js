var intrinsic = require('./lib/intrinsic');
var conditions = require('./lib/conditions');
var pseudo = require('./lib/pseudo');
var build = require('./lib/build');
var validate = require('./lib/validate');

/**
 * The cloudfriend module
 *
 * @example
 * var cloudfriend = require('cloudfriend');
 */
var cloudfriend = module.exports = {
  build: build,
  validate: validate
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
