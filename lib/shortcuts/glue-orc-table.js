'use strict';

const GlueTable = require('./glue-table');

class GlueOrcTable extends GlueTable {
  constructor(options = {}) {
    let { Parameters } = options;
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
    Parameters = Object.assign(
      { EXTERNAL: 'TRUE', 'orc.compress': 'SNAPPY' },
      Parameters
    );

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

module.exports = GlueOrcTable;
