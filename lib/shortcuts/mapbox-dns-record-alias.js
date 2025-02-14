'use strict';

const cdkCommonDNS = require('@mapbox/mapbox-cdk-common/lib/constructs/mapbox-dns-record');
const cdkCommonSchemaDNS = require('@mapbox/mapbox-cdk-common/lib/utils/schemas/dns-schema');

/**
 * Create an ALIAS DNS record in mapbox.com/tilestream.net/mbxinternal.com
 *
 * @param {Object} options - Options.
 * @param {String} options.LogicalName - The logical name of the IAM role
 * within the CloudFormation template.
 *
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const role = new cf.shortcuts.MapboxDnsRecordAlias({
 *   Id: 'My-Record', // This becomes part of the logical id of the output
 *   Name: 'record-1', // Becomes 'record-1.mapbox.com'
 *   Environment: 'hey',
 *   HostedZone: 'mapbox.com', // Or 'tilestream.net' or 'mbxinternal.com',
 *   Routing: RoutingType.Simple,
 *   Target: {
 *     loadBalancerCanonicalHostedZoneId: '123123',
 *     loadBalancerDnsName: 'hoooo',
 *   },
 *   HealthChecks: [{ Path: '/lite' }],
 * });
 *
 * module.exports = cf.merge(myTemplate, role);
 */
class MapboxDnsRecordAlias {
  constructor(options) {
    if (!options) throw new Error('Options required');

    const {
      Id,
      HostedZone,
      ...rest
    } = options;

    const foundHostedZone = Object.values(cdkCommonSchemaDNS.MapboxHostedZones).find((z) => z.HostedZoneName === HostedZone);
    if (!foundHostedZone) {
      throw new Error(`Invalid HostedZone parameter. Must be one of: ${Object.values(cdkCommonSchemaDNS.MapboxHostedZones).map((v) => v.HostedZoneName).join(', ')}`);
    }

    this.Outputs = new cdkCommonDNS.MapboxDnsRecordAlias({
      ...rest,
      HostedZone: foundHostedZone
    }).toCloudfriend(Id);
  }
}

module.exports = MapboxDnsRecordAlias;
