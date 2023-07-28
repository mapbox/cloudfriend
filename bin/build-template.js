#!/usr/bin/env node

'use strict';
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const cloudfriend = require('..');
const argv = require('minimist')(process.argv.slice(2), {
  default: { region: 'us-east-1' },
  alias: { r: 'region' }
});
const templatePath = argv._[0];

cloudfriend.build(templatePath, argv)
  .then((template) => {
    console.log(JSON.stringify(template, null, 4));
  });
