import type { DropDatabase } from './types.js'

/**
 * Drops every user table in the connected database. SQL Server enforces foreign keys during
 * `DROP TABLE`, so we first drop all foreign-key constraints, then drop the tables themselves.
 */
export const dropDatabase: DropDatabase = async function ({ adapter }) {
  const statement = /* sql */ `
    DECLARE @sql NVARCHAR(MAX) = N'';

    SELECT @sql += 'ALTER TABLE '
      + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
      + '.' + QUOTENAME(OBJECT_NAME(parent_object_id))
      + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(10)
    FROM sys.foreign_keys;

    SELECT @sql += 'DROP TABLE '
      + QUOTENAME(OBJECT_SCHEMA_NAME(object_id))
      + '.' + QUOTENAME(name) + ';' + CHAR(10)
    FROM sys.tables;

    IF LEN(@sql) > 0 EXEC sp_executesql @sql;
  `

  await adapter.client.request().batch(statement)
}
