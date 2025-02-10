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
  const name = getNameFromDrizzleTable(table)

  if (!joins.some((eachJoin) => getNameFromDrizzleTable(eachJoin.table) === name)) {
    joins.push({ type, condition, queryPath, table })
  }
}
