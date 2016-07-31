#!/usr/bin/env node

/* eslint-disable no-console */

var cloudfriend = require('..');
var templatePath = process.argv[2];

cloudfriend.build(templatePath)
  .then(function(template) {
    console.log(JSON.stringify(template, null, 4));
  });
