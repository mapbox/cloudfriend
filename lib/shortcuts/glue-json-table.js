'use strict';

const GlueTable = require('./glue-table');

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
