import type { Payload } from 'payload'

import type { RawColumn, RawTable } from '../../../types.js'

const sqlTypesByRawColumnType: Partial<Record<RawColumn['type'], string>> = {
  integer: 'INTEGER',
  numeric: 'NUMERIC',
  text: 'TEXT',
  uuid: 'UUID',
  varchar: 'VARCHAR',
}

/**
 * Returns the SQL type the schema generator declares for a column, so columns created by the
 * localize-status migration match `generate:db-schema`, `migrate:create` and `push`.
 * Creates the enum type first when the generator declares one that the database does not have yet.
 * Falls back to `fallbackType` when the generator does not know the column.
 */
export async function getGeneratedColumnType({
  columnName,
  db,
  fallbackType,
  payload,
  schemaName,
  sql,
  tableName,
}: {
  columnName: string
  db: any
  fallbackType: string
  payload: Payload
  schemaName: string
  sql: any
  tableName: string
}): Promise<any> {
  const column = getRawColumn({ columnName, payload, tableName })

  if (!column) {
    return sql.raw(fallbackType)
  }

  if (column.type !== 'enum') {
    return sql.raw(sqlTypesByRawColumnType[column.type] ?? fallbackType)
  }

  const isLocaleEnum = 'locale' in column
  const enumName = isLocaleEnum ? '_locales' : column.enumName
  const options = isLocaleEnum
    ? (payload.config.localization || { localeCodes: [] }).localeCodes
    : column.options
  const enumType = sql`${sql.identifier(schemaName)}.${sql.identifier(enumName)}`

  const enumExistsResult = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT EXISTS (
        SELECT FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = ${schemaName}
        AND t.typname = ${enumName}
      ) as exists
    `,
  })

  if (!enumExistsResult.rows[0]?.exists) {
    // CREATE TYPE does not accept bind parameters, so the options are inlined as escaped literals
    const optionLiterals = options.map((option) => `'${option.replaceAll("'", "''")}'`).join(', ')

    await db.execute({
      drizzle: db.drizzle,
      sql: sql`CREATE TYPE ${enumType} AS ENUM (${sql.raw(optionLiterals)})`,
    })
  }

  return enumType
}

/**
 * Reads the generator's raw schema from the adapter. The `db` a migration receives is a Drizzle
 * transaction handle, which does not carry `rawTables`.
 */
export const getRawTable = ({
  payload,
  tableName,
}: {
  payload: Payload
  tableName: string
}): RawTable | undefined =>
  (payload.db as unknown as { rawTables?: Record<string, RawTable> }).rawTables?.[tableName]

const getRawColumn = ({
  columnName,
  payload,
  tableName,
}: {
  columnName: string
  payload: Payload
  tableName: string
}): RawColumn | undefined =>
  Object.values(getRawTable({ payload, tableName })?.columns ?? {}).find(
    (column) => column.name === columnName,
  )
