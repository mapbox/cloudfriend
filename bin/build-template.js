#!/usr/bin/env node

'use strict';

const cloudfriend = require('..');
const argv = require('minimist')(process.argv.slice(2));
const templatePath = argv._[0];
cloudfriend.build(templatePath, argv)
  .then(function(template) {
    console.log(JSON.stringify(template, null, 4));
  });
