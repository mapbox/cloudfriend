'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue Table supported by line-delimited JSON files on S3.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the Glue JSON table. Accepts [the same `options` as the vanilla Glue Table](#gluetable), though the following additional properties are either required or hard-wired:
 * @param {String} options.Location the physical location of the table. See [AWS documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location)
 * @param {String} [options.TableType='EXTERNAL_TABLE'] hard-wired by this shortcut.
 * @param {String} [options.InputFormat='org.apache.hadoop.mapred.TextInputFormat'] hard-wired by this shortcut.
 * @param {String} [options.OutputFormat='org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'] hard-wired by this shortcut.
 * @param {Object} [options.SerdeInfo] hard-wired by this shortcut.
 * @param {Object} [options.SerdeInfo.SerializationLibrary='org.openx.data.jsonserde.JsonSerDe'] hard-wired by this shortcut.
 */
class GlueJsonTable extends GlueTable {
  constructor(options = {}) {
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
