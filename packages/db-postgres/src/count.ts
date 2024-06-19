import type { Count } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'

import { sql } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { ChainedMethods } from './find/chainMethods'
import type { PostgresAdapter } from './types'

import { chainMethods } from './find/chainMethods'
import buildQuery from './queries/buildQuery'

export const count: Count = async function count(
  this: PostgresAdapter,
  { collection, locale, req, where: whereArg },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const db = this.sessions[await req.transactionID]?.db || this.drizzle
  const table = this.tables[tableName]

  const { joinAliases, joins, where } = await buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    locale,
    tableName,
    where: whereArg,
  })

  const selectCountMethods: ChainedMethods = []

  joinAliases.forEach(({ condition, table }) => {
    selectCountMethods.push({
      args: [table, condition],
      method: 'leftJoin',
    })
  })

  Object.entries(joins).forEach(([joinTable, condition]) => {
    if (joinTable) {
      selectCountMethods.push({
        args: [this.tables[joinTable], condition],
        method: 'leftJoin',
      })
    }
  })

  const countResult = await chainMethods({
    methods: selectCountMethods,
    query: db
      .select({
        count: sql<number>`count
            (DISTINCT ${this.tables[tableName].id})`,
      })
      .from(table)
      .where(where),
  })

  return { totalDocs: Number(countResult[0].count) }
}
