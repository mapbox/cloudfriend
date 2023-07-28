#!/usr/bin/env node

'use strict';
const cloudfriend = require('..');
const argv = require('minimist')(process.argv.slice(2), {
  default: { region: 'us-east-1' },
  alias: { r: 'region' }
});
const templatePath = argv._[0];
const region = argv.region || 'us-east-1';

cloudfriend.validate(templatePath, region)
  .then(() => {
    console.log('✔ valid');
  }).catch((err) => {
    console.log('✘ invalid: %s', err.message);
    process.exit(1);
  });
