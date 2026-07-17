import { defineRelations } from 'drizzle-orm'

import type { DrizzleAdapter } from '../types.js'

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
  adapter.relations = defineRelations(adapter.tables, (r) => {
    const config: Record<string, Record<string, any>> = {}

    const getTableConfig = (tableName: string): Record<string, any> => {
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
    const addRelationKey = (tableConfig: Record<string, any>, key: string, tableName: string) => {
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
  }) as DrizzleAdapter['relations']
}
