'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue table backed by Parquet files on S3.
 *
 * @param {Object} options - Accepts the same options as cloudfriend's
 * [`GlueTable`](https://github.com/mapbox/cloudfriend/blob/master/lib/shortcuts/glue-table.js),
 * though the following additional attributes are either required or hard-wired:
 * @param {String} options.Location - The physical location of the table. See
 * [AWS
 * documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-storagedescriptor.html#cfn-glue-table-storagedescriptor-location).
 * @param {String} [options.TableType='EXTERNAL_TABLE'] - Hard-wired by this
 * shortcut.
 * @param {String}
 * [options.InputFormat='org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat']
 * - Hard-wired by this shortcut.
 * @param {String}
 * [options.OutputFormat='org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat']
 * - Hard-wired by this shortcut.
 * @param {Object} [options.SerdeInfo] - Hard-wired by this shortcut.
 * @param {String}
 * [options.SerdeInfo.SerializationLibrary='org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe']
 * - Hard-wired by this shortcut.
 */
class GlueParquetTable extends GlueTable {
  constructor(options) {
    if (!options) throw new Error('Options required');
    const { Location } = options;

    const required = [Location];
    if (required.some((variable) => !variable))
      throw new Error('You must provide a Location');

    super(
      Object.assign(
        {
          Database: options.Database || 'loading_dock_production',
          TableType: 'EXTERNAL_TABLE',
          Parameters: { EXTERNAL: 'true' },
          InputFormat:
            'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
          OutputFormat:
            'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
          Compressed: false,
          NumberOfBuckets: 0,
          SerdeInfo: {
            SerializationLibrary:
              'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
            Parameters: { 'parquet.compress': 'SNAPPY' }
          },
          SortColumns: [],
          StoredAsSubDirectories: true
        },
        options
      )
    );
  }
}

module.exports = GlueParquetTable;
