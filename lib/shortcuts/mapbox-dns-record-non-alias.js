'use strict';

const cdkCommonDNS = require('@mapbox/mapbox-cdk-common/lib/constructs/mapbox-dns-record');
const cdkCommonSchemaDNS = require('@mapbox/mapbox-cdk-common/lib/utils/schemas/dns-schema');
const Joi = require('joi');

/**
 * Create a  DNS record in mapbox.com/tilestream.net/mbxinternal.com
 *
 * @param {Object} options - Options.
 * @param {String} options.LogicalName - The logical name of the IAM role
 * within the CloudFormation template.
 *
 * const cf = require('@mapbox/cloudfriend');
 *
 * const myTemplate = { ... };
 *
 * const record = new cf.shortcuts.MapboxDnsRecordNonAlias({
 *   Id: 'My-Record', // This becomes part of the logical id of the output
 *   Name: 'record-1', // Becomes 'record-1.mapbox.com'
 *   Environment: 'staging',
 *   HostedZone: 'mapbox.com', // Or 'tilestream.net' or 'mbxinternal.com',
 *   Routing: 'Simple', // Or 'Weighted', 'Latency', 'Geo'
 *   Target: 'hello.com',
 *   HealthChecks: [{ FQDN: 'mydomain.com', Path: '/lite' }],
 *   Type: 'A', // Or, 'CNAME', 'AAAA'
 *   TTL: 10, // Seconds
 * });
 *
 * module.exports = cf.merge(myTemplate, record);
 */
class MapboxDnsRecordNonAlias {
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

    const dnsRecordProps = {
      ...rest,
      HostedZone: foundHostedZone
    };

    this.Outputs = new cdkCommonDNS.MapboxDnsRecordNonAlias(dnsRecordProps).toCloudfriendOutputs(Id);
  }
}

module.exports = MapboxDnsRecordNonAlias;
