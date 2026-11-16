import type { AnyRelationsBuilderConfig, RelationsRecord } from 'drizzle-orm'

import { defineRelations, defineRelationsPart } from 'drizzle-orm'

import type { DrizzleAdapter } from '../types.js'

type AdapterRelations = DrizzleAdapter['relations']

/**
 * Builds the drizzle v1 (RQB v2) relational config from Payload's abstract `rawRelations`.
 *
 * Unlike RQB v1 (where relations were declared per-table via the `relations()` helper and
 * spread into the schema), RQB v2 defines every relation in a single `defineRelations` call.
 * The resulting config is passed to the driver as `drizzle({ relations })`, which is what
 * powers `db.query`.
 *
 * Payload's `one` relations carry the join columns (`fields`/`references`), while `many`
 * relations only reference the paired relation by `relationName`. In RQB v2 the join columns
 * map to `from`/`to` and `relationName` maps to `alias`, so a `many` relation is linked to its
 * `one` counterpart purely through the shared alias.
 */
export const buildDrizzleRelations = ({ adapter }: { adapter: DrizzleAdapter }) => {
  // Relations already present were added by `beforeSchemaInit` hooks (`destroy` clears them
  // before a re-init), so keep them on top of the ones Payload builds.
  const hookRelations = adapter.relations

  const payloadRelations = defineRelations(adapter.tables, (r) => {
    const config: AnyRelationsBuilderConfig = {}

    const getTableConfig = (tableName: string): RelationsRecord => {
      if (!config[tableName]) {
        config[tableName] = {}
      }
      return config[tableName]
    }

    // In RQB v2 relations share a namespace with columns and a `one` relation's `from`
    // columns must belong to the table the relation is defined on. Payload's relation keys
    // (e.g. `_parentID`, `parent`) can collide with column names, and localized-relationship
    // FKs live on the `_locales` table rather than the parent, so the relation is owned by the
    // table its `from` columns belong to and colliding keys are mangled. These are only matched
    // by alias and are never referenced by key in `with` clauses.
    const addRelationKey = (tableConfig: RelationsRecord, key: string, tableName: string) => {
      const columns = adapter.rawTables[tableName]?.columns ?? {}
      let relationKey = key
      while (relationKey in columns || relationKey in tableConfig) {
        relationKey = `_${relationKey}`
      }
      return relationKey
    }

    for (const tableName in adapter.rawRelations) {
      const rawRelations = adapter.rawRelations[tableName]

      for (const key in rawRelations) {
        const relation = rawRelations[key]

        if (relation.type === 'one') {
          // The relation is owned by the table its `from` columns belong to.
          const ownerTableName = relation.fields[0]?.table ?? tableName
          const tableConfig = getTableConfig(ownerTableName)
          const relationKey = addRelationKey(tableConfig, key, ownerTableName)

          tableConfig[relationKey] = r.one[relation.to]({
            alias: relation.relationName,
            from: relation.fields.map((field) => r[field.table][field.name]) as any,
            optional: true,
            to: relation.references.map((reference) => r[relation.to][reference]) as any,
          })
        } else if (adapter.tables[relation.to]) {
          const tableConfig = getTableConfig(tableName)
          const relationKey = addRelationKey(tableConfig, key, tableName)

          tableConfig[relationKey] = r.many[relation.to]({
            alias: relation.relationName,
          })
        }
      }
    }

    return config
  }) as AdapterRelations

  adapter.relations = mergeDrizzleRelations({ base: payloadRelations, extra: hookRelations })
}

/**
 * Merges two relational configs table by table, so relations defined separately (e.g. with
 * `defineRelationsPart` in a schema hook) extend a table's relations instead of replacing them.
 */
export const mergeDrizzleRelations = ({
  base,
  extra,
}: {
  base: AdapterRelations
  extra: AdapterRelations | undefined
}): AdapterRelations => {
  const merged: AdapterRelations = { ...base }

  for (const tableName in extra) {
    const baseTable = base[tableName]
    const extraTable = extra[tableName]

    merged[tableName] =
      baseTable && extraTable && baseTable !== extraTable
        ? { ...baseTable, relations: { ...baseTable.relations, ...extraTable.relations } }
        : extraTable
  }

  return merged
}

/**
 * Tables added by `afterSchemaInit` hooks are created after relations are built. Register them
 * without relations so they are still available on `db.query`.
 */
export const addMissingTablesToRelations = ({ adapter }: { adapter: DrizzleAdapter }) => {
  const missingTables = Object.fromEntries(
    Object.entries(adapter.tables).filter(([tableName]) => !adapter.relations[tableName]),
  )

  if (Object.keys(missingTables).length) {
    adapter.relations = {
      ...adapter.relations,
      ...(defineRelationsPart(missingTables) as AdapterRelations),
    }
  }
}
