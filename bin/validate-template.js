#!/usr/bin/env node

'use strict';

const cloudfriend = require('..');
const templatePath = process.argv[2];
const region = process.argv[3] || 'us-east-1';

cloudfriend.validate(templatePath, region)
  .then(() => {
    console.log('✔ valid');
  }).catch((err) => {
    console.log('✘ invalid: %s', err.message);
    process.exit(1);
  });
