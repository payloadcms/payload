import type { Payload } from '../../../../types/index.js'

type GeneratedColumn = {
  enumName?: string
  locale?: boolean
  name: string
  options?: string[]
  type: string
}

type GeneratedTable = {
  columns: Record<string, GeneratedColumn>
  foreignKeys?: Record<string, { name: string }>
  indexes?: Record<string, { name: string }>
}

const sqlTypesByColumnType: Record<string, string> = {
  integer: 'INTEGER',
  numeric: 'NUMERIC',
  text: 'TEXT',
  uuid: 'UUID',
  varchar: 'VARCHAR',
}

/**
 * Returns the SQL type the Drizzle schema generator declares for a column, so columns created by the
 * localize-status migration match `generate:db-schema`, `migrate:create` and `push`.
 * Creates the enum type first when the generator declares one that the database does not have yet.
 * Falls back to `fallbackType` when the generator does not know the column.
 */
export async function getGeneratedColumnType({
  columnName,
  db,
  fallbackType,
  payload,
  sql,
  tableName,
}: {
  columnName: string
  db: any
  fallbackType: string
  payload: Payload
  sql: any
  tableName: string
}): Promise<any> {
  const column = Object.values(getGeneratedTable({ payload, tableName })?.columns ?? {}).find(
    ({ name }) => name === columnName,
  )

  if (!column) {
    return sql.raw(fallbackType)
  }

  if (column.type !== 'enum') {
    return sql.raw(sqlTypesByColumnType[column.type] ?? fallbackType)
  }

  const schemaName: string = (payload.db as { schemaName?: string }).schemaName || 'public'
  const enumName = column.locale ? '_locales' : column.enumName!
  const options = column.locale
    ? (payload.config.localization || { localeCodes: [] }).localeCodes
    : (column.options ?? [])
  const enumType = sql`${sql.identifier(schemaName)}.${sql.identifier(enumName)}`

  const enumExistsResult = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = ${schemaName}
      AND t.typname = ${enumName}
    ) as exists
  `)

  if (!enumExistsResult.rows[0]?.exists) {
    // CREATE TYPE does not accept bind parameters, so the options are inlined as escaped literals
    const optionLiterals = options.map((option) => `'${option.replaceAll("'", "''")}'`).join(', ')

    await db.execute(sql`CREATE TYPE ${enumType} AS ENUM (${sql.raw(optionLiterals)})`)
  }

  return enumType
}

export const getGeneratedTable = ({
  payload,
  tableName,
}: {
  payload: Payload
  tableName: string
}): GeneratedTable | undefined =>
  (payload.db as { rawTables?: Record<string, GeneratedTable> }).rawTables?.[tableName]
