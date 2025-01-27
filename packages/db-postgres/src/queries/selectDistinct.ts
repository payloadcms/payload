import type { QueryPromise, SQL } from 'drizzle-orm'

import type { ChainedMethods } from '../find/chainMethods'
import type { DrizzleDB, PostgresAdapter } from '../types'
import type { BuildQueryJoinAliases, BuildQueryJoins } from './buildQuery'

import { chainMethods } from '../find/chainMethods'
import { type GenericColumn } from '../types'

type Args = {
  adapter: PostgresAdapter
  chainedMethods?: ChainedMethods
  db: DrizzleDB
  joinAliases: BuildQueryJoinAliases
  joins: BuildQueryJoins
  selectFields: Record<string, GenericColumn>
  tableName: string
  where: SQL
}

/**
 * Selects distinct records from a table only if there are joins that need to be used, otherwise return null
 */
export const selectDistinct = ({
  adapter,
  chainedMethods = [],
  db,
  joinAliases,
  joins,
  selectFields,
  tableName,
  where,
}: Args): QueryPromise<Record<string, GenericColumn> & { id: number | string }[]> => {
  if (Object.keys(joins).length > 0 || joinAliases.length > 0) {
    if (where) {
      chainedMethods.push({ args: [where], method: 'where' })
    }

    joinAliases.forEach(({ condition, table }) => {
      chainedMethods.push({
        args: [table, condition],
        method: 'leftJoin',
      })
    })

    Object.entries(joins).forEach(([joinTable, condition]) => {
      if (joinTable) {
        chainedMethods.push({
          args: [adapter.tables[joinTable], condition],
          method: 'leftJoin',
        })
      }
    })

    return chainMethods({
      methods: chainedMethods,
      query: db.selectDistinct(selectFields).from(adapter.tables[tableName]),
    })
  }
}
