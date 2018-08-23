'use strict';

const path = require('path');
const exec = require('child_process').exec;
const test = require('tape');

test('bin/build-template', (t) => {
  const script = path.normalize(__dirname + '/../bin/build-template.js');
  const template = path.normalize(__dirname + '/fixtures/sync-args.js');
  t.test('outputs expected', (q) => {
    exec([script, template, '--this', 'that', '-r', 'cn-north-1'].join(' '), (err, stdout, stderr) => {
      q.error(err);
      q.error(stderr);
      const result = JSON.parse(stdout);
      q.equal('that', result.this);
      q.equal('cn-north-1', result.region);
      q.end();
    });
  });
  t.end();
});

