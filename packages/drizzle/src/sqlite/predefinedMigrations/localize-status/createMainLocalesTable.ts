import { sql } from 'drizzle-orm'

/** Creates and seeds the status-only locales table needed by nested-localization upgrades. */
export async function createMainLocalesTable({
  db,
  locales,
  mainTable,
}: {
  db: any
  locales: string[]
  mainTable: string
}): Promise<void> {
  const mainLocalesTable = `${mainTable}_locales`
  const { parentType, hasLegacyStatus } = await getLocaleParentInfo({ db, tableName: mainTable })

  await db.run(sql`
    CREATE TABLE ${sql.identifier(mainLocalesTable)} (
      id INTEGER PRIMARY KEY,
      _locale TEXT NOT NULL,
      _parent_id ${sql.raw(parentType)} NOT NULL,
      _status TEXT DEFAULT 'draft',
      UNIQUE(_locale, _parent_id),
      FOREIGN KEY (_parent_id) REFERENCES ${sql.identifier(mainTable)}(id) ON DELETE CASCADE
    )
  `)

  const status = hasLegacyStatus ? sql.identifier('_status') : sql`'draft'`

  for (const locale of locales) {
    await db.run(sql`
      INSERT INTO ${sql.identifier(mainLocalesTable)} (_locale, _parent_id, _status)
      SELECT ${locale}, id, ${status} FROM ${sql.identifier(mainTable)}
    `)
  }
}

export async function getLocaleParentInfo({
  db,
  tableName,
}: {
  db: any
  tableName: string
}): Promise<{ parentType: string; hasLegacyStatus: boolean }> {
  const columns = await db.all(sql`SELECT name, type FROM pragma_table_info(${tableName})`)
  const idColumn = columns.find((column) => column.name === 'id')
  const parentType = { integer: 'INTEGER', numeric: 'NUMERIC', text: 'TEXT' }[
    idColumn?.type.toLowerCase()
  ]

  if (!parentType) {
    throw new Error(`Cannot migrate localized status: unsupported ID type in ${tableName}`)
  }

  return { parentType, hasLegacyStatus: columns.some((column) => column.name === '_status') }
}
