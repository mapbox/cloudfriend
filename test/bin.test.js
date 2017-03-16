var path = require('path');
var exec = require('child_process').exec;
var test = require('tape');

test('bin/build-template', function(t) {
  var script = path.normalize(__dirname + '/../bin/build-template.js');
  var template = path.normalize(__dirname + '/fixtures/sync-args.js');
  t.test('outputs expected', function(q) {
    exec([script, template, '--this', 'that'].join(' '), function(err, stdout, stderr) {
      q.error(err);
      q.error(stderr);
      var result = JSON.parse(stdout);
      q.equal('that', result.this);
      q.end();
    });
  });
  t.end();
});

