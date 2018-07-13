#!/usr/bin/env node

'use strict';

const cloudfriend = require('..');
const templatePath = process.argv[2];

cloudfriend.build(templatePath)
  .then((template) => {
    console.log(JSON.stringify(template, null, 4));
  });
