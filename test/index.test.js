var test = require('tape');
var cloudfriend = require('..');
var path = require('path');

var expectedTemplate = JSON.stringify(require('./fixtures/static.json'), null, 4);
var fixtures = path.resolve(__dirname, 'fixtures');

test('intrinsic functions', (assert) => {
  assert.deepEqual(cloudfriend.base64('secret'), { 'Fn::Base64': 'secret' }, 'base64');
  assert.deepEqual(cloudfriend.findInMap('mapping', 'key', 'value'), { 'Fn::FindInMap': ['mapping', 'key', 'value'] }, 'lookup');
  assert.deepEqual(cloudfriend.getAtt('obj', 'key'), { 'Fn::GetAtt': ['obj', 'key'] }, 'attr');
  assert.deepEqual(cloudfriend.getAzs(), { 'Fn::GetAZs': '' }, 'azs (no value specified)');
  assert.deepEqual(cloudfriend.getAzs('us-east-1'), { 'Fn::GetAZs': 'us-east-1' }, 'azs (value specified)');
  assert.deepEqual(cloudfriend.join(['abra', 'cadabra']), { 'Fn::Join': ['', ['abra', 'cadabra']] }, 'join (no delimeter specified)');
  assert.deepEqual(cloudfriend.join('-', ['abra', 'cadabra']), { 'Fn::Join': ['-', ['abra', 'cadabra']] }, 'join (delimeter specified)');
  assert.deepEqual(cloudfriend.select(1, ['abra', 'cadabra']), { 'Fn::Select': ['1', ['abra', 'cadabra']] }, '');
  assert.deepEqual(cloudfriend.ref('something'), { Ref: 'something' }, 'ref');
  assert.deepEqual(cloudfriend.userData(['#!/usr/bin/env bash', 'set -e']), { 'Fn::Base64': { 'Fn::Join': ['\n', ['#!/usr/bin/env bash', 'set -e']] } }, 'userData');
  assert.end();
});

test('conditions', (assert) => {
  assert.deepEqual(cloudfriend.and(['a', 'b']), { 'Fn::And': ['a', 'b'] }, 'and');
  assert.deepEqual(cloudfriend.equal('a', 'b'), { 'Fn::Equals': ['a', 'b'] }, 'equal');
  assert.deepEqual(cloudfriend.if('condition', 'a', 'b'), { 'Fn::If': ['condition', 'a', 'b'] }, 'if');
  assert.deepEqual(cloudfriend.not('condition'), { 'Fn::Not': ['condition'] }, 'not');
  assert.deepEqual(cloudfriend.or(['a', 'b']), { 'Fn::Or': ['a', 'b'] }, 'or');
  assert.deepEqual(cloudfriend.notEqual('a', 'b'), { 'Fn::Not': [{ 'Fn::Equals': ['a', 'b'] }] }, 'notEqual');
  assert.end();
});

test('pseudo', (assert) => {
  assert.deepEqual(cloudfriend.account(), { Ref: 'AWS::AccountId' }, 'account');
  assert.deepEqual(cloudfriend.notificationArns(), { Ref: 'AWS::NotificationARNs' }, 'notificationArns');
  assert.deepEqual(cloudfriend.noValue(), { Ref: 'AWS::NoValue' }, 'noValue');
  assert.deepEqual(cloudfriend.region(), { Ref: 'AWS::Region' }, 'region');
  assert.deepEqual(cloudfriend.stackId(), { Ref: 'AWS::StackId' }, 'stackId');
  assert.deepEqual(cloudfriend.stack(), { Ref: 'AWS::StackName' }, 'stack');
  assert.end();
});

test('build', (assert) => {
  assert.plan(5);

  cloudfriend.build(path.join(fixtures, 'static.json'))
    .then(function(template) {
      assert.equal(template, expectedTemplate, 'static.json');
      return cloudfriend.build(path.join(fixtures, 'static.js'));
    })
    .then(function(template) {
      assert.equal(template, expectedTemplate, 'static.js');
      return cloudfriend.build(path.join(fixtures, 'sync.js'));
    })
    .then(function(template) {
      assert.equal(template, expectedTemplate, 'sync.js');
      return cloudfriend.build(path.join(fixtures, 'async.js'));
    })
    .then(function(template) {
      assert.equal(template, expectedTemplate, 'async.js (success)');
      return cloudfriend.build(path.join(fixtures, 'async-error.js'));
    })
    .catch(function(err) {
      assert.ok(err, 'async.js (error)');
    });
});

test('validate', (assert) => {
  assert.plan(2);

  cloudfriend.validate(path.join(fixtures, 'static.json'))
    .then(function() {
      assert.ok(true, 'valid');
      return cloudfriend.validate(path.join(fixtures, 'invalid.json'));
    })
    .catch(function(err) {
      assert.equal(err.message, 'Template format error: Unrecognized resource type: AWS::Not::aThing', 'invalid');
    });
});
