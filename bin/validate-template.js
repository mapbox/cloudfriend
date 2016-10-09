#!/usr/bin/env node

/* eslint-disable no-console */

var cloudfriend = require('..');
var templatePath = process.argv[2];

cloudfriend.validate(templatePath, 'us-east-1')
  .then(function() {
    console.log('✔ valid');
  }).catch(function(err) {
    console.log('✘ invalid: %s', err.message);
    process.exit(1);
  });
