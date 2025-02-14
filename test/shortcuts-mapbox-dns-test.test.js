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
    Id: 'My-Record', // This becomes part of the logical id of the output
    Name: 'record-1', // Becomes 'record-1.mapbox.com'
    Environment: 'staging',
    HostedZone: 'mapbox.com', // Or 'tilestream.net' or 'mbxinternal.com',
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
})
;
