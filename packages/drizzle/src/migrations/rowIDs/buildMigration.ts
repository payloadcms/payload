import type { DrizzleAdapter, RequireDrizzleKit } from '../../types.js'
import type { RowIDMigrationPlan, RowIDSnapshot, RowIDTable } from './types.js'

/** Prepare the row-key conversion separately from unrelated config changes. */
export async function buildRowIDMigration({
  adapter,
  after: nextSnapshot,
  before: previousSnapshot,
  generateMigration,
}: {
  adapter: Pick<DrizzleAdapter, 'idType'>
  after: unknown
  before: unknown
  generateMigration: Awaited<ReturnType<RequireDrizzleKit>>['generateMigration']
}): Promise<{ plan?: RowIDMigrationPlan; snapshot: RowIDSnapshot }> {
  const before = previousSnapshot as RowIDSnapshot
  const after = nextSnapshot as RowIDSnapshot
  const snapshot = structuredClone(before)
  const conversions = new Map<
    string,
    NonNullable<RowIDMigrationPlan['tables'][number]['conversion']>
  >()

  for (const [key, table] of Object.entries(before.tables)) {
    const target = after.tables[key]

    if (
      !target ||
      !table.columns._order ||
      !table.columns._parent_id ||
      !table.columns.id?.primaryKey ||
      !target.columns.id?.primaryKey
    ) {
      continue
    }

    const direction =
      !table.columns._uuid && target.columns._uuid
        ? 'up'
        : table.columns._uuid && !target.columns._uuid
          ? 'down'
          : undefined

    if (!direction) {
      continue
    }

    const logical = direction === 'up' ? table.columns.id : table.columns._uuid
    const destination = direction === 'up' ? target.columns._uuid : target.columns.id

    if (
      !['integer', 'numeric', 'text', 'varchar'].includes(logical.type) ||
      logical.type !== destination.type
    ) {
      throw new Error(
        `Cannot migrate row IDs in ${key}: the public ID type also changed. Migrate those changes separately.`,
      )
    }

    conversions.set(key, {
      direction,
      newType: target.columns.id.type,
      oldType: table.columns.id.type,
    })
    const columns = snapshot.tables[key].columns

    columns.id = structuredClone(target.columns.id)
    if (direction === 'up') {
      columns._uuid = structuredClone(target.columns._uuid)
    } else {
      delete columns._uuid
    }
  }

  if (!conversions.size) {
    return { snapshot }
  }

  const getKey = ({ name, from, schema }: { from: RowIDTable; name: string; schema?: string }) =>
    before.dialect === 'postgresql' ? `${schema || from.schema || 'public'}.${name}` : name
  const rebuilt = new Set(conversions.keys())

  // Include the full inbound ownership graph. Otherwise dropping an old parent
  // could cascade into a table that has not yet been copied.
  let hasAddedTable = true

  while (hasAddedTable) {
    hasAddedTable = false
    for (const [key, table] of Object.entries(before.tables)) {
      for (const foreignKey of Object.values(table.foreignKeys)) {
        const target = getKey({
          name: foreignKey.tableTo,
          from: table,
          schema: foreignKey.schemaTo,
        })

        if (rebuilt.has(target) && !rebuilt.has(key)) {
          rebuilt.add(key)
          hasAddedTable = true
        }
        if (conversions.has(target)) {
          if (foreignKey.columnsFrom.length !== 1 || foreignKey.columnsTo[0] !== 'id') {
            throw new Error(`Cannot automatically migrate composite row references in ${key}.`)
          }
          const column = snapshot.tables[key].columns[foreignKey.columnsFrom[0]]

          column.type =
            snapshot.tables[target].columns.id.type === 'serial'
              ? 'integer'
              : snapshot.tables[target].columns.id.type
        }
      }
    }
  }

  // Parent-first copying also handles immediate FK checks and RESTRICT actions.
  const ordered: string[] = []
  const visiting = new Set<string>()
  const visit = ({ key }: { key: string }) => {
    if (ordered.includes(key)) {
      return
    }
    if (visiting.has(key)) {
      throw new Error(
        `Row ID migration contains a foreign-key cycle at ${key}; write a custom migration.`,
      )
    }
    visiting.add(key)
    const table = before.tables[key]

    for (const foreignKey of Object.values(table.foreignKeys)) {
      const target = getKey({ name: foreignKey.tableTo, from: table, schema: foreignKey.schemaTo })

      if (rebuilt.has(target)) {
        visit({ key: target })
      }
    }
    visiting.delete(key)
    ordered.push(key)
  }

  for (const key of rebuilt) {
    visit({ key })
  }

  const usedNames = new Set(
    [...Object.values(before.tables), ...Object.values(after.tables)].map(({ name }) => name),
  )
  let counter = 0
  const reserve = ({ prefix }: { prefix: string }) => {
    let name: string

    do {
      name = `${prefix}${counter++}`
    } while (usedNames.has(name))
    usedNames.add(name)
    return name
  }
  const tables: RowIDMigrationPlan['tables'] = ordered.map((key) => {
    const table = snapshot.tables[key]

    if (
      Object.keys(table.compositePrimaryKeys ?? {}).length ||
      Object.keys(table.uniqueConstraints ?? {}).length
    ) {
      throw new Error(
        `Row ID migration in ${key} has custom key constraints; write a custom migration.`,
      )
    }

    return {
      name: table.name,
      columns: Object.values(table.columns).map(({ name }) => name),
      conversion: conversions.get(key),
      foreignKeys: Object.values(table.foreignKeys).flatMap((foreignKey) => {
        const target = getKey({
          name: foreignKey.tableTo,
          from: table,
          schema: foreignKey.schemaTo,
        })

        return conversions.has(target) ? [{ column: foreignKey.columnsFrom[0], target }] : []
      }),
      key,
      knownIndexes: Object.keys(before.tables[key].indexes),
      mapping: reserve({ prefix: '__payload_row_map_' }),
      schema: table.schema,
      serialColumns: Object.values(table.columns)
        .filter(({ type }) => type === 'serial')
        .map(({ name }) => name),
      temporary: reserve({ prefix: '__payload_rows_' }),
    }
  })
  const clones = structuredClone(snapshot)

  clones.tables = {}
  const withoutIndexes = structuredClone(snapshot)

  for (const plan of tables) {
    const table = structuredClone(snapshot.tables[plan.key])

    table.name = plan.temporary
    table.indexes = {}
    withoutIndexes.tables[plan.key].indexes = {}
    for (const foreignKey of Object.values(table.foreignKeys)) {
      foreignKey.tableFrom = plan.temporary
      const target = getKey({ name: foreignKey.tableTo, from: table, schema: foreignKey.schemaTo })
      const rebuiltTarget = tables.find(({ key }) => key === target)

      if (rebuiltTarget) {
        foreignKey.tableTo = rebuiltTarget.temporary
      }
    }
    const key =
      before.dialect === 'postgresql' ? `${table.schema || 'public'}.${table.name}` : table.name

    clones.tables[key] = table
  }
  const empty = { ...structuredClone(before), tables: {} }
  // Drizzle also emits unrelated views/roles in snapshots. They already exist.
  for (const key of ['views', 'policies']) {
    if (key in empty) {
      empty[key] = {}
      clones[key] = {}
    }
  }
  const createStatements = await generateMigration(empty as never, clones as never)
  const indexStatements = await generateMigration(withoutIndexes as never, snapshot as never)

  return {
    plan: {
      createStatements: createStatements.filter(
        (statement) => !/^PRAGMA foreign_keys/.test(statement),
      ),
      dialect: before.dialect === 'postgresql' ? 'postgresql' : 'sqlite',
      idType: adapter.idType === 'uuid' || adapter.idType === 'uuidv7' ? adapter.idType : 'number',
      indexStatements,
      tables,
    },
    snapshot,
  }
}
