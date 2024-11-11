import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

import { index, uniqueIndex } from 'drizzle-orm/sqlite-core'

type CreateIndexArgs = {
  indexName: string
  name: string | string[]
  unique?: boolean
}

export const createIndex = ({ name, indexName, unique }: CreateIndexArgs) => {
  return (table: { [x: string]: AnySQLiteColumn }) => {
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
