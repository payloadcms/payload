import { index, uniqueIndex } from 'drizzle-orm/pg-core'

import type { GenericColumn } from '../types.js'

type CreateIndexArgs = {
  indexName: string
  name: string | string[]
  unique?: boolean
}

export const createIndex = ({ name, indexName, unique }: CreateIndexArgs) => {
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
    if (unique) {
      return uniqueIndex(indexName).on(columns[0], ...columns.slice(1))
    }
    return index(indexName).on(columns[0], ...columns.slice(1))
  }
}
