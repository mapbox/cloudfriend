'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue Table backed by line-delimited JSON files on S3.
 *
 * @param {Object} options - Accepts the same options as [`GlueTable`](#gluetable), though the following additional attributes are either required or hard-wired:
 * @param {String} options.Location - The physical location of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location).
 * @param {String} [options.TableType='EXTERNAL_TABLE'] - Hard-wired by this shortcut.
 * @param {String} [options.InputFormat='org.apache.hadoop.mapred.TextInputFormat'] - Hard-wired by this shortcut.
 * @param {String} [options.OutputFormat='org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'] - Hard-wired by this shortcut.
 * @param {Object} [options.SerdeInfo] - Hard-wired by this shortcut.
 * @param {Object} [options.SerdeInfo.SerializationLibrary='org.openx.data.jsonserde.JsonSerDe'] - Hard-wired by this shortcut.
 */
class GlueJsonTable extends GlueTable {
  constructor(options) {
    if (!options) throw new Error('Options required');
    let { Parameters } = options;
    const { Location } = options;

    const required = [Location];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a Location');

    const TableType = 'EXTERNAL_TABLE';
    const InputFormat = 'org.apache.hadoop.mapred.TextInputFormat';
    const OutputFormat =
      'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat';
    const SerdeInfo = {
      SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe'
    };
    Parameters = Object.assign({ classification: 'json' }, Parameters);

    super(
      Object.assign(
        {
          TableType,
          InputFormat,
          OutputFormat,
          SerdeInfo,
          Parameters
        },
        options
      )
    );
  }
}

module.exports = GlueJsonTable;
