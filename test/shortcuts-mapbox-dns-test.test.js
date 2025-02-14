'use strict';

const test = require('tape');
const cf = require('..');
const fixtures = require('./fixtures/shortcuts');

const update = !!process.env.UPDATE;

const noUndefined = (template) => JSON.parse(JSON.stringify(template));

test('[shortcuts] mapbox-dns-record-alias-simple', (assert) => {
  assert.throws(
    () => new cf.shortcuts.MapboxDnsRecordAlias(),
    'Options required',
    'throws without options'
  );

  let template = cf.merge({
    Resources: {
      MyLoadBalancer: {
        'Type': 'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'Properties': {
          Name: 'hello-lb'
        }
      }
    }
  });

  const dnsRecord = new cf.shortcuts.MapboxDnsRecordAlias({
    Id: 'My-Record',
    Name: 'record-1',
    Environment: 'staging',
    HostedZone: 'mapbox.com',
    Routing: 'Simple',
    Target: 'MyLoadBalancer',
    HealthChecks: [{ Path: '/lite' }]
  });
  template = cf.merge(template, dnsRecord);

  if (update) fixtures.update('mapbox-dns-record-alias-simple', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('mapbox-dns-record-alias-simple'),
    'expected resources generated'
  );

  assert.end();
});

test('[shortcuts] mapbox-dns-record-non-alias-simple', (assert) => {
  assert.throws(
    () => new cf.shortcuts.MapboxDnsRecordNonAlias(),
    'Options required',
    'throws without options'
  );

  let template = cf.merge();

  const dnsRecord = new cf.shortcuts.MapboxDnsRecordNonAlias({
    Id: 'My-Record',
    Name: 'record-1',
    Type: 'CNAME',
    Environment: 'staging',
    HostedZone: 'mapbox.com',
    Routing: 'Simple',
    Target: 'hello.com',
    HealthChecks: [{ Path: '/lite' }],
    TTL: 10
  });
  template = cf.merge(template, dnsRecord);

  if (update) fixtures.update('mapbox-dns-record-non-alias-simple', template);
  assert.deepEqual(
    noUndefined(template),
    fixtures.get('mapbox-dns-record-non-alias-simple'),
    'expected resources generated'
  );

  assert.end();
});

