import { sql } from 'drizzle-orm'

/** Creates and seeds the status-only locales table needed by nested-localization upgrades. */
export async function createMainLocalesTable({
  db,
  locales,
  mainTable,
  schemaName,
}: {
  db: any
  locales: string[]
  mainTable: string
  schemaName: string
}): Promise<void> {
  const mainLocalesTable = `${mainTable}_locales`
  const { parentType, hasLegacyStatus } = await getLocaleParentInfo({
    db,
    tableName: mainTable,
    schemaName,
  })

  await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      CREATE TABLE ${sql.identifier(mainLocalesTable)} (
        id SERIAL PRIMARY KEY,
        _locale VARCHAR NOT NULL,
        _parent_id ${sql.raw(parentType)} NOT NULL,
        _status VARCHAR DEFAULT 'draft',
        UNIQUE(_locale, _parent_id),
        FOREIGN KEY (_parent_id) REFERENCES ${sql.identifier(mainTable)}(id) ON DELETE CASCADE
      )
    `,
  })

  const status = hasLegacyStatus ? sql.identifier('_status') : sql`'draft'`

  for (const locale of locales) {
    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        INSERT INTO ${sql.identifier(mainLocalesTable)} (_locale, _parent_id, _status)
        SELECT ${locale}, id, ${status} FROM ${sql.identifier(mainTable)}
      `,
    })
  }
}

export async function getLocaleParentInfo({
  db,
  tableName,
  schemaName,
}: {
  db: any
  tableName: string
  schemaName: string
}): Promise<{ parentType: string; hasLegacyStatus: boolean }> {
  const result = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = ${schemaName} AND table_name = ${tableName}
    `,
  })
  const idColumn = result.rows.find((column) => column.column_name === 'id')
  const parentType = {
    bigint: 'BIGINT',
    'character varying': 'VARCHAR',
    integer: 'INTEGER',
    numeric: 'NUMERIC',
    smallint: 'SMALLINT',
    text: 'TEXT',
    uuid: 'UUID',
  }[idColumn?.data_type]

  if (!parentType) {
    throw new Error(`Cannot migrate localized status: unsupported ID type in ${tableName}`)
  }

  return {
    parentType,
    hasLegacyStatus: result.rows.some((column) => column.column_name === '_status'),
  }
}
