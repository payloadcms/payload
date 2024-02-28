/* eslint-disable no-param-reassign */
import { index, uniqueIndex } from 'drizzle-orm/pg-core'

import type { GenericColumn } from '../types'

type CreateIndexArgs = {
  columnName: string
  name: string | string[]
  tableName: string
  unique?: boolean
}

export const createIndex = ({ name, columnName, tableName, unique }: CreateIndexArgs) => {
  return (table: { [x: string]: GenericColumn }) => {
    let columns
    if (Array.isArray(name)) {
      columns = name
        .map((columnName) => table[columnName])
        // exclude fields were included in compound indexes but do not exist on the table
        .filter((col) => typeof col !== 'undefined')
    } else {
      columns = [table[name]]
    }
    if (unique)
      return uniqueIndex(`${tableName}_${columnName}_idx`).on(columns[0], ...columns.slice(1))
    return index(`${tableName}_${columnName}_idx`).on(columns[0], ...columns.slice(1))
  }
}
