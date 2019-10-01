'use strict';

const GlueTable = require('./glue-table');

class GlueJsonTable extends GlueTable {
  constructor(options = {}) {
    let { Parameters } = options;
    const {
      Columns,
      DatabaseName: schema,
      OriginalSql: originalSql,
      SqlVariables = {}
    } = options;

    const required = [schema, Columns, originalSql];
    if (required.some((variable) => !variable))
      throw new Error(
        'You must provide a DatabaseName, Columns, and OriginalSql'
      );

    const TableType = 'VIRTUAL_VIEW';
    const StoredAsSubDirectories = false;
    const ViewExpandedText = '/* Presto View */';
    Parameters = Object.assign(
      { comment: 'Presto View', presto_view: 'true' },
      Parameters
    );

    const columns = Columns.map((c) => ({
      name: c.Name,
      type: c.Type.replace(/string/g, 'varchar')
    }));

    const view = {
      'Fn::Base64': {
        'Fn::Sub': [
          JSON.stringify({
            catalog: 'awsdatacatalog',
            schema,
            originalSql,
            columns
          }),
          SqlVariables
        ]
      }
    };

    const ViewOriginalText = {
      'Fn::Sub': ['/* Presto View: ${view} */', { view }]
    };

    super(
      Object.assign(
        {
          TableType,
          Parameters,
          StoredAsSubDirectories,
          ViewOriginalText,
          ViewExpandedText
        },
        options
      )
    );
  }
}

module.exports = GlueJsonTable;
