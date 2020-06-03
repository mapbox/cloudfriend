'use strict';

const GlueTable = require('./glue-table');

/**
 * Create a Glue Presto View.
 *
 * @param {Object} options - Accepts the same options as [`GlueTable`](#gluetable), though the following additional attributes are either required or hard-wired:
 * @param {String} options.OriginalSql - The SQL query that defines the view.
 * @param {String} [options.TableType='VIRTUAL_VIEW'] - Hard-wired by this shortcut.
 */
class GlueSparkView extends GlueTable {
  constructor(options = {}) {
    let { SqlVariables = {} } = options;
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
    SqlVariables = Object.assign({ DatabaseName }, SqlVariables);

    const view = {
      'Fn::Sub': [
        originalSql,
        SqlVariables
      ]
    };

    super(
      Object.assign(
        {
          TableType,
          StoredAsSubDirectories,
          ViewOriginalText: view
        },
        options
      )
    );
  }
}

module.exports = GlueSparkView;
