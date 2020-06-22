'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue Table backed by ORC files on S3.
 *
 * @param {Object} options - Accepts the same options as [`GlueTable`](#gluetable), though the following additional attributes are either required or hard-wired:
 * @param {String} options.Location - The physical location of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location).
 * @param {String} [options.TableType='EXTERNAL_TABLE'] - Hard-wired by this shortcut.
 * @param {String} [options.InputFormat='org.apache.hadoop.hive.ql.io.orc.OrcInputFormat'] - Hard-wired by this shortcut.
 * @param {String} [options.OutputFormat='org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat'] - Hard-wired by this shortcut.
 * @param {Object} [options.SerdeInfo] - Hard-wired by this shortcut.
 * @param {Object} [options.SerdeInfo.SerializationLibrary='org.apache.hadoop.hive.ql.io.orc.OrcSerde'] - Hard-wired by this shortcut.
 */
class GlueOrcTable extends GlueTable {
  constructor(options) {
    if (!options) throw new Error('Options required');
    const { Location } = options;

    const required = [Location];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a Location');

    const TableType = 'EXTERNAL_TABLE';
    const InputFormat = 'org.apache.hadoop.hive.ql.io.orc.OrcInputFormat';
    const OutputFormat = 'org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat';
    const SerdeInfo = {
      SerializationLibrary: 'org.apache.hadoop.hive.ql.io.orc.OrcSerde',
      Parameters: { 'serialization.format': '1' }
    };

    super(
      Object.assign(
        {
          TableType,
          InputFormat,
          OutputFormat,
          SerdeInfo
        },
        options
      )
    );
  }
}

module.exports = GlueOrcTable;
