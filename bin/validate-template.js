#!/usr/bin/env node

/* eslint-disable no-console */

var cloudfriend = require('..');
var templatePath = process.argv[2];
var region = process.argv[3] || 'us-east-1';

cloudfriend.validate(templatePath, region)
  .then(function() {
    console.log('✔ valid');
  }).catch(function(err) {
    console.log('✘ invalid: %s', err.message);
    process.exit(1);
  });
