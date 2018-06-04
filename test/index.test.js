var test = require('tape');
var cloudfriend = require('..');
var path = require('path');

var expectedTemplate = require('./fixtures/static.json');
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
  assert.deepEqual(cloudfriend.split(',', 'a,b,c,d'), { 'Fn::Split': [',', 'a,b,c,d'] }, 'split');
  assert.deepEqual(cloudfriend.split(',', cloudfriend.ref('Id')), { 'Fn::Split': [',', { Ref: 'Id' }] }, 'split');
  assert.deepEqual(cloudfriend.userData(['#!/usr/bin/env bash', 'set -e']), { 'Fn::Base64': { 'Fn::Join': ['\n', ['#!/usr/bin/env bash', 'set -e']] } }, 'userData');
  assert.deepEqual(cloudfriend.sub('my ${thing}'), { 'Fn::Sub': 'my ${thing}' }, 'sub without variables');
  assert.deepEqual(cloudfriend.sub('my ${thing}', { thing: 'stuff' }), { 'Fn::Sub': ['my ${thing}', { thing: 'stuff' }] }, 'sub with variables');
  assert.deepEqual(cloudfriend.importValue('id'), { 'Fn::ImportValue': 'id' }, 'import value with string');
  assert.deepEqual(cloudfriend.importValue(cloudfriend.ref('Id')), { 'Fn::ImportValue': cloudfriend.ref('Id') }, 'import value with string');
  assert.deepEqual(cloudfriend.arn('s3', 'my-bucket/*'), { 'Fn::Sub': ['arn:${AWS::Partition}:${service}:::${suffix}', { service: 's3', suffix: 'my-bucket/*' }] }, 's3 arn');
  assert.deepEqual(cloudfriend.arn('cloudformation', 'stack/my-stack/*'), { 'Fn::Sub': ['arn:${AWS::Partition}:${service}:${AWS::Region}:${AWS::AccountId}:${suffix}', { service: 'cloudformation', suffix: 'stack/my-stack/*' }] }, 'non-s3 arn');
  assert.end();
});

test('conditions', (assert) => {
  assert.deepEqual(cloudfriend.and(['a', 'b']), { 'Fn::And': ['a', 'b'] }, 'and');
  assert.deepEqual(cloudfriend.equals('a', 'b'), { 'Fn::Equals': ['a', 'b'] }, 'equal');
  assert.deepEqual(cloudfriend.if('condition', 'a', 'b'), { 'Fn::If': ['condition', 'a', 'b'] }, 'if');
  assert.deepEqual(cloudfriend.not('condition'), { 'Fn::Not': ['condition'] }, 'not');
  assert.deepEqual(cloudfriend.or(['a', 'b']), { 'Fn::Or': ['a', 'b'] }, 'or');
  assert.deepEqual(cloudfriend.notEquals('a', 'b'), { 'Fn::Not': [{ 'Fn::Equals': ['a', 'b'] }] }, 'notEqual');
  assert.end();
});

test('pseudo', (assert) => {
  assert.deepEqual(cloudfriend.accountId, { Ref: 'AWS::AccountId' }, 'account');
  assert.deepEqual(cloudfriend.notificationArns, { Ref: 'AWS::NotificationARNs' }, 'notificationArns');
  assert.deepEqual(cloudfriend.noValue, { Ref: 'AWS::NoValue' }, 'noValue');
  assert.deepEqual(cloudfriend.region, { Ref: 'AWS::Region' }, 'region');
  assert.deepEqual(cloudfriend.stackId, { Ref: 'AWS::StackId' }, 'stackId');
  assert.deepEqual(cloudfriend.stackName, { Ref: 'AWS::StackName' }, 'stack');
  assert.deepEqual(cloudfriend.partition, { Ref: 'AWS::Partition' }, 'stack');
  assert.deepEqual(cloudfriend.urlSuffix, { Ref: 'AWS::URLSuffix' }, 'stack');
  assert.end();
});

test('build', (assert) => {
  assert.plan(8);

  cloudfriend.build(path.join(fixtures, 'static.json'))
    .then(function(template) {
      assert.deepEqual(template, expectedTemplate, 'static.json');
      return cloudfriend.build(path.join(fixtures, 'static.js'));
    })
    .then(function(template) {
      assert.deepEqual(template, expectedTemplate, 'static.js');
      return cloudfriend.build(path.join(fixtures, 'sync.js'));
    })
    .then(function(template) {
      assert.deepEqual(template, expectedTemplate, 'sync.js');
      return cloudfriend.build(path.join(fixtures, 'async.js'));
    })
    .then(function(template) {
      assert.deepEqual(template, expectedTemplate, 'async.js (success)');
      return cloudfriend.build(path.join(fixtures, 'async-error.js'))
        .catch(function(err) {
          assert.ok(err, 'async.js (error)');
        });
    })
    .then(function() {
      return cloudfriend.build(path.join(fixtures, 'sync-args.js'), { some: 'options' });
    })
    .then(function(template) {
      assert.deepEqual(template, { some: 'options', }, 'passes args (sync)');
      return cloudfriend.build(path.join(fixtures, 'async-args.js'), { some: 'options' });
    })
    .then(function(template) {
      assert.deepEqual(template, { some: 'options', }, 'passes args (async)');
      return cloudfriend.build(path.join(fixtures, 'malformed.json'))
        .catch(function(err) {
          assert.ok(err, 'malformed JSON (error)');
        });
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
      assert.ok(/Template format error: Unrecognized resource type/.test(err.message), 'invalid');
    });
});

test('merge', (assert) => {
  var a = {
    Metadata: { Instances: { Description: 'Information about the instances' } },
    Parameters: { InstanceCount: { Type: 'Number' } },
    Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' } } },
    Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 999) },
    Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMI') } } },
    Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instance') } }
  };

  var b = {
    Metadata: { Databases: { Description: 'Information about the databases' } },
    Parameters: { DatabasePrefix: { Type: 'String' } },
    Mappings: { Prefix: { eggs: { Name: 'bananas' } } },
    Conditions: { TooMuch: cloudfriend.equals(cloudfriend.ref('DatabasePrefix'), 'bacon') },
    Resources: { Database: { Type: 'AWS::DynamoDB::Table', Properties: { Name: cloudfriend.findInMap('Prefix', cloudfriend.ref('DatabasePrefix'), 'Name') } } },
    Outputs: { GoSomewhereElse: { Condition: 'TooMuch', Value: cloudfriend.ref('Database') } }
  };

  var c = {
    Parameters: { NoConsequence: { Type: 'String' } }
  };

  assert.deepEqual(cloudfriend.merge(a, b, c), {
    AWSTemplateFormatVersion: '2010-09-09',
    Metadata: {
      Instances: { Description: 'Information about the instances' },
      Databases: { Description: 'Information about the databases' }
    },
    Parameters: {
      InstanceCount: { Type: 'Number' },
      DatabasePrefix: { Type: 'String' },
      NoConsequence: { Type: 'String' }
    },
    Mappings: {
      Region: { 'us-east-1': { AMI: 'ami-123456' } },
      Prefix: { eggs: { Name: 'bananas' } }
    },
    Conditions: {
      WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 999),
      TooMuch: cloudfriend.equals(cloudfriend.ref('DatabasePrefix'), 'bacon')
    },
    Resources: {
      Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMI') } },
      Database: { Type: 'AWS::DynamoDB::Table', Properties: { Name: cloudfriend.findInMap('Prefix', cloudfriend.ref('DatabasePrefix'), 'Name') } }
    },
    Outputs: {
      Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instance') },
      GoSomewhereElse: { Condition: 'TooMuch', Value: cloudfriend.ref('Database') }
    }
  }, 'merge without overlap');

  assert.throws(function() {
    b = { Metadata: { Instances: { Description: 'Information about the instances different' } } };
    cloudfriend.merge(a, b);
  }, /Metadata name used more than once: Instances/, 'throws on .Metadata overlap');

  assert.doesNotThrow(function() {
    b = { Metadata: { Instances: { Description: 'Information about the instances' } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Metadata overlap');

  assert.throws(function() {
    b = { Parameters: { InstanceCount: { Type: 'Number', Description: 'Different' } } };
    cloudfriend.merge(a, b);
  }, /Parameters name used more than once: InstanceCount/, 'throws on .Parameters overlap');

  assert.doesNotThrow(function() {
    b = { Parameters: { InstanceCount: { Type: 'Number' } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Parameters overlap');

  assert.throws(function() {
    b = { Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' }, 'us-east-4': { AMI: 'ami-123456' } } } };
    cloudfriend.merge(a, b);
  }, /Mappings name used more than once: Region/, 'throws on .Mappings overlap');

  assert.doesNotThrow(function() {
    b = { Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' } } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Mappings overlap');

  assert.throws(function() {
    b = { Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 998) } };
    cloudfriend.merge(a, b);
  }, /Conditions name used more than once: WouldYouLikeBaconWithThat/, 'throws on .Conditions overlap');

  assert.doesNotThrow(function() {
    b = { Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 999) } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Conditions overlap');

  assert.throws(function() {
    b = { Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMIz') } } } };
    cloudfriend.merge(a, b);
  }, /Resources name used more than once: Instance/, 'throws on .Resources overlap');

  assert.doesNotThrow(function() {
    b = { Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMI') } } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Resources overlap');

  assert.throws(function() {
    b = { Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instancez') } } };
    cloudfriend.merge(a, b);
  }, /Outputs name used more than once: Breakfast/, 'throws on .Outputs overlap');

  assert.doesNotThrow(function() {
    b = { Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instance') } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Outputs overlap');

  assert.doesNotThrow(function() {
    b = { Mappings: { Instance: { 'us-east-1': { AMI: 'ami-123456' } } } };
    cloudfriend.merge(a, b);
  }, 'does not throw on cross-property name overlap');

  assert.end();
});
