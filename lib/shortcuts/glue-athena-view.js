'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue Presto View.
 *
 * @property {Object} Resources - the CloudFormation resources created by this shortcut.
 *
 * @param {Object} options configuration options for the Glue Presto View. Accepts [the same `options` as the vanilla Glue Table](#gluetable), though the following additional properties are either required or hard-wired:
 * @param {String} options.OriginalSql the SQL query that defines the view.
 * @param {String} [options.TableType='VIRTUAL_VIEW'] hard-wired by this shortcut.

 */
class GlueAthenaView extends GlueTable {
  constructor(options = {}) {
    let { Parameters, SqlVariables = {} } = options;
    const {
      Columns,
      DatabaseName,
      OriginalSql: originalSql
    } = options;

    const required = [DatabaseName, Columns, originalSql];
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
    SqlVariables = Object.assign({ DatabaseName }, SqlVariables);

    const columns = Columns.map((c) => ({
      name: c.Name,
      type: c.Type.replace(/string/g, 'varchar')
    }));

    const view = {
      'Fn::Base64': {
        'Fn::Sub': [
          JSON.stringify({
            catalog: 'awsdatacatalog',
            schema: '${DatabaseName}',
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

module.exports = GlueAthenaView;
