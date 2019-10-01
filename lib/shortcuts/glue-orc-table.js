'use strict';

const GlueTable = require('./glue-table');

class GlueOrcTable extends GlueTable {
  constructor(options = {}) {
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
