'use strict';

const intrinsic = require('../intrinsic');
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
 * const record = new cf.shortcuts.MapboxDnsRecordAlias({
 *   Id: 'My-Record', // This becomes part of the logical id of the output
 *   Name: 'record-1', // Becomes 'record-1.mapbox.com'
 *   Environment: 'staging',
 *   HostedZone: 'mapbox.com', // Or 'tilestream.net' or 'mbxinternal.com',
 *   Routing: 'Simple', // Or 'Weighted', 'Latency', 'Geo'
 *   Target: LoadBalancerLogicalId,
 *   HealthChecks: [{ Path: '/lite' }],
 * });
 *
 * module.exports = cf.merge(myTemplate, record);
 */
class MapboxDnsRecordAlias {
  constructor(options) {
    if (!options) throw new Error('Options required');

    const required = ['HostedZone', 'Id', 'Target', 'Name', 'Environment', 'Routing'];
    const notFound = required.filter((key) => !options[key]);
    if (notFound.length > 0) {
      throw new Error(`You must provide: ${notFound.join(', ')}`);
    }

    const {
      Id,
      HostedZone,
      Target,
      ...rest
    } = options;

    const foundHostedZone = Object.values(cdkCommonSchemaDNS.MapboxHostedZones).find((z) => z.HostedZoneName === HostedZone);
    if (!foundHostedZone) {
      throw new Error(`Invalid HostedZone parameter. Must be one of: ${Object.values(cdkCommonSchemaDNS.MapboxHostedZones).map((v) => v.HostedZoneName).join(', ')}`);
    }

    const loadBalancerCanonicalHostedZoneId = intrinsic.getAtt(Target, 'CanonicalHostedZoneID');
    const loadBalancerDnsName = intrinsic.getAtt(Target, 'DNSName');

    this.Outputs = new cdkCommonDNS.MapboxDnsRecordAlias({
      ...rest,
      HostedZone: foundHostedZone,
      Target: {
        loadBalancerCanonicalHostedZoneId,
        loadBalancerDnsName
      }
    }).toCloudfriendOutputs(Id);
  }
}

module.exports = MapboxDnsRecordAlias;
