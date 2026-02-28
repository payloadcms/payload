import { type SQL } from 'drizzle-orm'
import { type PgTableWithColumns } from 'drizzle-orm/pg-core'

import type { GenericTable } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'

export const addJoinTable = ({
  type,
  condition,
  joins,
  queryPath,
  table,
}: {
  condition: SQL
  joins: BuildQueryJoinAliases
  queryPath?: string
  table: GenericTable | PgTableWithColumns<any>
  type?: 'innerJoin' | 'leftJoin' | 'rightJoin'
}) => {
  if (
    !joins.some((eachJoin) => {
      if (queryPath && eachJoin.queryPath === queryPath) {
        return true
      }
      return getNameFromDrizzleTable(eachJoin.table) === getNameFromDrizzleTable(table)
    })
  ) {
    joins.push({ type, condition, queryPath, table })
  }
}
