#!/usr/bin/env node

'use strict';

const cloudfriend = require('..');
const templatePath = process.argv[2];
const region = process.argv[3] || 'us-east-1';

cloudfriend.build(templatePath, { region })
  .then((template) => {
    console.log(JSON.stringify(template, null, 4));
  });
