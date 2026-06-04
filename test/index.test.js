'use strict';

const cloudfriend = require('..');
const path = require('path');

const expectedTemplate = require('./fixtures/static.json');
const fixtures = path.resolve(__dirname, 'fixtures');

describe('intrinsic functions', () => {
  test('base64', () => {
    expect(cloudfriend.base64('secret')).toEqual({ 'Fn::Base64': 'secret' });
  });

  test('cidr', () => {
    expect(cloudfriend.cidr('ipBlock', 1, 2)).toEqual({ 'Fn::Cidr': ['ipBlock', 1, 2] });
  });

  test('lookup', () => {
    expect(cloudfriend.findInMap('mapping', 'key', 'value')).toEqual({ 'Fn::FindInMap': ['mapping', 'key', 'value'] });
  });

  test('lookup with default value', () => {
    expect(cloudfriend.findInMap('mapping', 'key', 'value', 'hello-world')).toEqual({ 'Fn::FindInMap': ['mapping', 'key', 'value', { DefaultValue: 'hello-world' }] });
  });

  test('forEach', () => {
    expect(
      cloudfriend.forEach('somethings', 'topic', ['abra', 'cadabra'], 'magic', {
        Type: 'AWS::SNS::Topic',
        Properties: { TopicName: cloudfriend.ref('topic') }
      })
    ).toEqual({
      'Fn::ForEach::somethings': [
        'topic',
        ['abra', 'cadabra'],
        'magic${topic}',
        {
          Type: 'AWS::SNS::Topic',
          Properties: { TopicName: { 'Ref': 'topic' } }
        }
      ]
    });
  });

  test('attr', () => {
    expect(cloudfriend.getAtt('obj', 'key')).toEqual({ 'Fn::GetAtt': ['obj', 'key'] });
  });

  test('azs (no value specified)', () => {
    expect(cloudfriend.getAzs()).toEqual({ 'Fn::GetAZs': '' });
  });

  test('azs (value specified)', () => {
    expect(cloudfriend.getAzs('us-east-1')).toEqual({ 'Fn::GetAZs': 'us-east-1' });
  });

  test('join (no delimeter specified)', () => {
    expect(cloudfriend.join(['abra', 'cadabra'])).toEqual({ 'Fn::Join': ['', ['abra', 'cadabra']] });
  });

  test('join (delimeter specified)', () => {
    expect(cloudfriend.join('-', ['abra', 'cadabra'])).toEqual({ 'Fn::Join': ['-', ['abra', 'cadabra']] });
  });

  test('select', () => {
    expect(cloudfriend.select(1, ['abra', 'cadabra'])).toEqual({ 'Fn::Select': ['1', ['abra', 'cadabra']] });
  });

  test('ref', () => {
    expect(cloudfriend.ref('something')).toEqual({ Ref: 'something' });
  });

  test('split', () => {
    expect(cloudfriend.split(',', 'a,b,c,d')).toEqual({ 'Fn::Split': [',', 'a,b,c,d'] });
  });

  test('split with ref', () => {
    expect(cloudfriend.split(',', cloudfriend.ref('Id'))).toEqual({ 'Fn::Split': [',', { Ref: 'Id' }] });
  });

  test('userData', () => {
    expect(cloudfriend.userData(['#!/usr/bin/env bash', 'set -e'])).toEqual({ 'Fn::Base64': { 'Fn::Join': ['\n', ['#!/usr/bin/env bash', 'set -e']] } });
  });

  test('sub without variables', () => {
    expect(cloudfriend.sub('my ${thing}')).toEqual({ 'Fn::Sub': 'my ${thing}' });
  });

  test('sub with variables', () => {
    expect(cloudfriend.sub('my ${thing}', { thing: 'stuff' })).toEqual({ 'Fn::Sub': ['my ${thing}', { thing: 'stuff' }] });
  });

  test('import value with string', () => {
    expect(cloudfriend.importValue('id')).toEqual({ 'Fn::ImportValue': 'id' });
  });

  test('import value with ref', () => {
    expect(cloudfriend.importValue(cloudfriend.ref('Id'))).toEqual({ 'Fn::ImportValue': cloudfriend.ref('Id') });
  });

  test('s3 arn', () => {
    expect(cloudfriend.arn('s3', 'my-bucket/*')).toEqual({ 'Fn::Sub': ['arn:${AWS::Partition}:${service}:::${suffix}', { service: 's3', suffix: 'my-bucket/*' }] });
  });

  test('non-s3 arn', () => {
    expect(cloudfriend.arn('cloudformation', 'stack/my-stack/*')).toEqual({ 'Fn::Sub': ['arn:${AWS::Partition}:${service}:${AWS::Region}:${AWS::AccountId}:${suffix}', { service: 'cloudformation', suffix: 'stack/my-stack/*' }] });
  });

  test('transform', () => {
    expect(cloudfriend.transform('name', { 'a': 'b', 'c': 'd' })).toEqual({ 'Fn::Transform': { Name: 'name', Parameters: { 'a': 'b', 'c': 'd' } } });
  });
});

describe('conditions', () => {
  test('and', () => {
    expect(cloudfriend.and(['a', 'b'])).toEqual({ 'Fn::And': ['a', 'b'] });
  });

  test('equal', () => {
    expect(cloudfriend.equals('a', 'b')).toEqual({ 'Fn::Equals': ['a', 'b'] });
  });

  test('if', () => {
    expect(cloudfriend.if('condition', 'a', 'b')).toEqual({ 'Fn::If': ['condition', 'a', 'b'] });
  });

  test('not', () => {
    expect(cloudfriend.not('condition')).toEqual({ 'Fn::Not': ['condition'] });
  });

  test('or', () => {
    expect(cloudfriend.or(['a', 'b'])).toEqual({ 'Fn::Or': ['a', 'b'] });
  });

  test('notEqual', () => {
    expect(cloudfriend.notEquals('a', 'b')).toEqual({ 'Fn::Not': [{ 'Fn::Equals': ['a', 'b'] }] });
  });
});

describe('rules', () => {
  test('contains', () => {
    expect(cloudfriend.contains(['a', 'b'], 'a')).toEqual({ 'Fn::Contains': [['a', 'b'], 'a'] });
  });

  test('eachMemberEquals', () => {
    expect(cloudfriend.eachMemberEquals(['a', 'a'], 'a')).toEqual({ 'Fn::EachMemberEquals': [['a', 'a'], 'a'] });
  });

  test('eachMemberIn', () => {
    expect(cloudfriend.eachMemberIn(['a', 'b'], ['a', 'b', 'c'])).toEqual({ 'Fn::EachMemberIn': [['a', 'b'], ['a', 'b', 'c']] });
  });

  test('refAll', () => {
    expect(cloudfriend.refAll('a')).toEqual({ 'Fn::RefAll': 'a' });
  });

  test('valueOf', () => {
    expect(cloudfriend.valueOf('a', 'b')).toEqual({ 'Fn::ValueOf': ['a', 'b'] });
  });

  test('valueOfAll', () => {
    expect(cloudfriend.valueOfAll('a', 'b')).toEqual({ 'Fn::ValueOfAll': ['a', 'b'] });
  });
});

describe('pseudo', () => {
  test('account', () => {
    expect(cloudfriend.accountId).toEqual({ Ref: 'AWS::AccountId' });
  });

  test('notificationArns', () => {
    expect(cloudfriend.notificationArns).toEqual({ Ref: 'AWS::NotificationARNs' });
  });

  test('noValue', () => {
    expect(cloudfriend.noValue).toEqual({ Ref: 'AWS::NoValue' });
  });

  test('region', () => {
    expect(cloudfriend.region).toEqual({ Ref: 'AWS::Region' });
  });

  test('stackId', () => {
    expect(cloudfriend.stackId).toEqual({ Ref: 'AWS::StackId' });
  });

  test('stackName', () => {
    expect(cloudfriend.stackName).toEqual({ Ref: 'AWS::StackName' });
  });

  test('partition', () => {
    expect(cloudfriend.partition).toEqual({ Ref: 'AWS::Partition' });
  });

  test('urlSuffix', () => {
    expect(cloudfriend.urlSuffix).toEqual({ Ref: 'AWS::URLSuffix' });
  });
});

describe('build', () => {
  test('static.json', async () => {
    const template = await cloudfriend.build(path.join(fixtures, 'static.json'));
    expect(template).toEqual(expectedTemplate);
  });

  test('static.js', async () => {
    const template = await cloudfriend.build(path.join(fixtures, 'static.js'));
    expect(template).toEqual(expectedTemplate);
  });

  test('sync.js', async () => {
    const template = await cloudfriend.build(path.join(fixtures, 'sync.js'));
    expect(template).toEqual(expectedTemplate);
  });

  test('async.js (success)', async () => {
    const template = await cloudfriend.build(path.join(fixtures, 'async.js'));
    expect(template).toEqual(expectedTemplate);
  });

  test('async.js (error)', async () => {
    await expect(cloudfriend.build(path.join(fixtures, 'async-error.js'))).rejects.toBeTruthy();
  });

  test('passes args (sync)', async () => {
    const template = await cloudfriend.build(path.join(fixtures, 'sync-args.js'), { some: 'options' });
    expect(template).toEqual({ some: 'options' });
  });

  test('passes args (async)', async () => {
    const template = await cloudfriend.build(path.join(fixtures, 'async-args.js'), { some: 'options' });
    expect(template).toEqual({ some: 'options' });
  });

  test('malformed JSON (error)', async () => {
    await expect(cloudfriend.build(path.join(fixtures, 'malformed.json'))).rejects.toBeTruthy();
  });
});

describe('merge', () => {
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

  test('merge without overlap', () => {
    const b = {
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

    expect(cloudfriend.merge(a, b, c)).toEqual({
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
    });
  });

  test('merge with string, array, and empty Transforms, ignoring duplicates', () => {
    expect(
      cloudfriend.merge(
        { Transform: 'foo' },
        { Transform: ['baz', 'bar'] },
        { Parameters: { InstanceCount: { Type: 'Number' } } }
      )
    ).toEqual({
      AWSTemplateFormatVersion: '2010-09-09',
      Metadata: {},
      Parameters: { InstanceCount: { Type: 'Number' } },
      Rules: {},
      Mappings: {},
      Conditions: {},
      Transform: ['foo', 'baz', 'bar'],
      Resources: {},
      Outputs: {}
    });
  });

  test('throws on duplicate Transform macro', () => {
    expect(() => {
      cloudfriend.merge({ Transform: ['foo', 'bar'] }, { Transform: ['baz', 'bar'] });
    }).toThrow(/Transform macro used more than once: bar/);
  });

  test('throws on .Metadata overlap', () => {
    const b = { Metadata: { Instances: { Description: 'Information about the instances different' } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).toThrow(/Metadata name used more than once: Instances/);
  });

  test('allows identical .Metadata overlap', () => {
    const b = { Metadata: { Instances: { Description: 'Information about the instances' } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });

  test('throws on .Parameters overlap', () => {
    const b = { Parameters: { InstanceCount: { Type: 'Number', Description: 'Different' } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).toThrow(/Parameters name used more than once: InstanceCount/);
  });

  test('allows identical .Parameters overlap', () => {
    const b = { Parameters: { InstanceCount: { Type: 'Number' } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });

  test('throws in .Rules overlap', () => {
    const b = { Rules: { WeAreOutOfBacon: { Assertions: [{ Assert: cloudfriend.not('WouldYouLikeBaconWithThat'), AssertDescription: 'Different' }] } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).toThrow(/Rules name used more than once: WeAreOutOfBacon/);
  });

  test('allows identical .Rules overlap', () => {
    const b = { Rules: { WeAreOutOfBacon: { Assertions: [{ Assert: cloudfriend.not('WouldYouLikeBaconWithThat') }] } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });

  test('throws on .Mappings overlap', () => {
    const b = { Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' }, 'us-east-4': { AMI: 'ami-123456' } } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).toThrow(/Mappings name used more than once: Region/);
  });

  test('allows identical .Mappings overlap', () => {
    const b = { Mappings: { Region: { 'us-east-1': { AMI: 'ami-123456' } } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });

  test('throws on .Conditions overlap', () => {
    const b = { Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 998) } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).toThrow(/Conditions name used more than once: WouldYouLikeBaconWithThat/);
  });

  test('allows identical .Conditions overlap', () => {
    const b = { Conditions: { WouldYouLikeBaconWithThat: cloudfriend.equals(cloudfriend.ref('InstanceCount'), 999) } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });

  test('throws on .Resources overlap', () => {
    const b = { Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMIz') } } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).toThrow(/Resources name used more than once: Instance/);
  });

  test('allows identical .Resources overlap', () => {
    const b = { Resources: { Instance: { Type: 'AWS::EC2::Instance', Properties: { ImageId: cloudfriend.findInMap('Region', cloudfriend.region, 'AMI') } } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });

  test('throws on .Outputs overlap', () => {
    const b = { Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instancez') } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).toThrow(/Outputs name used more than once: Breakfast/);
  });

  test('allows identical .Outputs overlap', () => {
    const b = { Outputs: { Breakfast: { Condition: 'WouldYouLikeBaconWithThat', Value: cloudfriend.ref('Instance') } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });

  test('does not throw on cross-property name overlap', () => {
    const b = { Mappings: { Instance: { 'us-east-1': { AMI: 'ami-123456' } } } };
    expect(() => {
      cloudfriend.merge(a, b);
    }).not.toThrow();
  });
});
