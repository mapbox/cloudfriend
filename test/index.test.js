'use strict';

const test = require('tape');
const cloudfriend = require('..');
const path = require('path');

const expectedTemplate = require('./fixtures/static.json');
const fixtures = path.resolve(__dirname, 'fixtures');

test('intrinsic functions', (assert) => {
  assert.deepEqual(cloudfriend.base64('secret'), { 'Fn::Base64': 'secret' }, 'base64');
  assert.deepEqual(cloudfriend.cidr('ipBlock', 1, 2), { 'Fn::Cidr': ['ipBlock', 1, 2] }, 'cidr');
  assert.deepEqual(cloudfriend.findInMap('mapping', 'key', 'value'), { 'Fn::FindInMap': ['mapping', 'key', 'value'] }, 'lookup');
  assert.deepEqual(cloudfriend.findInMap('mapping', 'key', 'value', 'hello-world'), { 'Fn::FindInMap': ['mapping', 'key', 'value', { DefaultValue: 'hello-world' }] }, 'lookup with default value');
  assert.deepEqual(
    cloudfriend.forEach('somethings', 'topic', ['abra', 'cadabra'], 'magic', {
      Type: 'AWS::SNS::Topic',
      Properties: { TopicName: cloudfriend.ref('topic') }
    }),
    {
      'Fn::ForEach::somethings': [
        'topic',
        ['abra', 'cadabra'],
        'magic${topic}',
        {
          Type: 'AWS::SNS::Topic',
          Properties: { TopicName: { 'Ref': 'topic' } }
        }
      ]
    },
    'forEach'
  );
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
  assert.deepEqual(cloudfriend.transform('name', { 'a': 'b', 'c': 'd' }), { 'Fn::Transform': { Name: 'name', Parameters: { 'a': 'b', 'c': 'd' } } }, 'cidr');
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

test('rules', (assert) => {
  assert.deepEqual(cloudfriend.contains(['a', 'b'], 'a'), { 'Fn::Contains': [['a', 'b'], 'a'] });
  assert.deepEqual(cloudfriend.eachMemberEquals(['a', 'a'], 'a'), { 'Fn::EachMemberEquals': [['a', 'a'], 'a'] });
  assert.deepEqual(cloudfriend.eachMemberIn(['a', 'b'], ['a', 'b', 'c']), { 'Fn::EachMemberIn': [['a', 'b'], ['a', 'b', 'c']] });
  assert.deepEqual(cloudfriend.refAll('a'), { 'Fn::RefAll': 'a' });
  assert.deepEqual(cloudfriend.valueOf('a', 'b'), { 'Fn::ValueOf': ['a', 'b'] });
  assert.deepEqual(cloudfriend.valueOfAll('a', 'b'), { 'Fn::ValueOfAll': ['a', 'b'] });
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
    .then((template) => {
      assert.deepEqual(template, expectedTemplate, 'static.json');
      return cloudfriend.build(path.join(fixtures, 'static.js'));
    })
    .then((template) => {
      assert.deepEqual(template, expectedTemplate, 'static.js');
      return cloudfriend.build(path.join(fixtures, 'sync.js'));
    })
    .then((template) => {
      assert.deepEqual(template, expectedTemplate, 'sync.js');
      return cloudfriend.build(path.join(fixtures, 'async.js'));
    })
    .then((template) => {
      assert.deepEqual(template, expectedTemplate, 'async.js (success)');
      return cloudfriend.build(path.join(fixtures, 'async-error.js'))
        .catch((err) => {
          assert.ok(err, 'async.js (error)');
        });
    })
    .then(() => {
      return cloudfriend.build(path.join(fixtures, 'sync-args.js'), { some: 'options' });
    })
    .then((template) => {
      assert.deepEqual(template, { some: 'options' }, 'passes args (sync)');
      return cloudfriend.build(path.join(fixtures, 'async-args.js'), { some: 'options' });
    })
    .then((template) => {
      assert.deepEqual(template, { some: 'options' }, 'passes args (async)');
      return cloudfriend.build(path.join(fixtures, 'malformed.json'))
        .catch((err) => {
          assert.ok(err, 'malformed JSON (error)');
        });
    });
});

test('merge', (assert) => {
  const a = {
    Metadata: { Instances: { Description: 'Information about the instances' } },
    Parameters: { InstanceCount: { Type: 'Number' } },
    Rules: { WeAreOutOfBacon: { Assertions: [{ Assert: cloudfriend.not('WouldYouLikeBaconWithThat') }] } },
    Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' } } },
    Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 999) },
    Transform: ['TransformB'],
    Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMI') } } },
    Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instance') } }
  };

  let b = {
    Metadata: { Databases: { Description: 'Information about the databases' } },
    Parameters: { DatabasePrefix: { Type: 'String' } },
    Rules: { YouMustHaveBacon: { Assertions: [{ Assert: cloudfriend.and([cloudfriend.not('WouldYouLikeBaconWithThat'), 'TooMuch']) }] } },
    Mappings: { Prefix: { eggs: { Name: 'bananas' } } },
    Conditions: { TooMuch: cloudfriend.equals(cloudfriend.ref('DatabasePrefix'), 'bacon') },
    Transform: ['TransformA'],
    Resources: { Database: { Type: 'AWS::DynamoDB::Table', Properties: { Name: cloudfriend.findInMap('Prefix', cloudfriend.ref('DatabasePrefix'), 'Name') } } },
    Outputs: { GoSomewhereElse: { Condition: 'TooMuch', Value: cloudfriend.ref('Database') } }
  };

  const c = {
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
    Rules: {
      WeAreOutOfBacon: { Assertions: [{ Assert: cloudfriend.not('WouldYouLikeBaconWithThat') }] },
      YouMustHaveBacon: { Assertions: [{ Assert: cloudfriend.and([cloudfriend.not('WouldYouLikeBaconWithThat'), 'TooMuch']) }] }
    },
    Mappings: {
      Region: { 'us-east-1': { AMI: 'ami-123456' } },
      Prefix: { eggs: { Name: 'bananas' } }
    },
    Conditions: {
      WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 999),
      TooMuch: cloudfriend.equals(cloudfriend.ref('DatabasePrefix'), 'bacon')
    },
    Transform: ['TransformB', 'TransformA'],
    Resources: {
      Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMI') } },
      Database: { Type: 'AWS::DynamoDB::Table', Properties: { Name: cloudfriend.findInMap('Prefix', cloudfriend.ref('DatabasePrefix'), 'Name') } }
    },
    Outputs: {
      Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instance') },
      GoSomewhereElse: { Condition: 'TooMuch', Value: cloudfriend.ref('Database') }
    }
  }, 'merge without overlap');

  assert.deepEqual(
    cloudfriend.merge(
      { Transform: 'foo' },
      { Transform: ['baz', 'bar'] },
      { Parameters: { InstanceCount: { Type: 'Number' } } }
    ),
    {
      AWSTemplateFormatVersion: '2010-09-09',
      Metadata: {},
      Parameters: { InstanceCount: { Type: 'Number' } },
      Rules: {},
      Mappings: {},
      Conditions: {},
      Transform: ['foo', 'baz', 'bar'],
      Resources: {},
      Outputs: {}
    },
    'merge with string, array, and empty Transforms, ignoring duplicates'
  );

  assert.throws(() => {
    cloudfriend.merge({ Transform: ['foo', 'bar'] }, { Transform: ['baz', 'bar'] });
  }, /Transform macro used more than once: bar/);

  assert.throws(() => {
    b = { Metadata: { Instances: { Description: 'Information about the instances different' } } };
    cloudfriend.merge(a, b);
  }, /Metadata name used more than once: Instances/, 'throws on .Metadata overlap');

  assert.doesNotThrow(() => {
    b = { Metadata: { Instances: { Description: 'Information about the instances' } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Metadata overlap');

  assert.throws(() => {
    b = { Parameters: { InstanceCount: { Type: 'Number', Description: 'Different' } } };
    cloudfriend.merge(a, b);
  }, /Parameters name used more than once: InstanceCount/, 'throws on .Parameters overlap');

  assert.doesNotThrow(() => {
    b = { Parameters: { InstanceCount: { Type: 'Number' } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Parameters overlap');

  assert.throws(() => {
    b = { Rules: { WeAreOutOfBacon: { Assertions: [{ Assert: cloudfriend.not('WouldYouLikeBaconWithThat'), AssertDescription: 'Different' }] } } };
    cloudfriend.merge(a, b);
  }, /Rules name used more than once: WeAreOutOfBacon/, 'throws in .Rules overlap');

  assert.doesNotThrow(() => {
    b = { Rules: { WeAreOutOfBacon: { Assertions: [{ Assert: cloudfriend.not('WouldYouLikeBaconWithThat') }] } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Rules overlap');

  assert.throws(() => {
    b = { Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' }, 'us-east-4': { AMI: 'ami-123456' } } } };
    cloudfriend.merge(a, b);
  }, /Mappings name used more than once: Region/, 'throws on .Mappings overlap');

  assert.doesNotThrow(() => {
    b = { Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' } } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Mappings overlap');

  assert.throws(() => {
    b = { Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 998) } };
    cloudfriend.merge(a, b);
  }, /Conditions name used more than once: WouldYouLikeBaconWithThat/, 'throws on .Conditions overlap');

  assert.doesNotThrow(() => {
    b = { Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 999) } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Conditions overlap');

  assert.throws(() => {
    b = { Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMIz') } } } };
    cloudfriend.merge(a, b);
  }, /Resources name used more than once: Instance/, 'throws on .Resources overlap');

  assert.doesNotThrow(() => {
    b = { Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMI') } } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Resources overlap');

  assert.throws(() => {
    b = { Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instancez') } } };
    cloudfriend.merge(a, b);
  }, /Outputs name used more than once: Breakfast/, 'throws on .Outputs overlap');

  assert.doesNotThrow(() => {
    b = { Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instance') } } };
    cloudfriend.merge(a, b);
  }, 'allows identical .Outputs overlap');

  assert.doesNotThrow(() => {
    b = { Mappings: { Instance: { 'us-east-1': { AMI: 'ami-123456' } } } };
    cloudfriend.merge(a, b);
  }, 'does not throw on cross-property name overlap');

  assert.end();
});
