/* eslint-disable no-param-reassign */
import { index, uniqueIndex } from 'drizzle-orm/pg-core'

import type { GenericColumn } from '../types'

type CreateIndexArgs = {
  columnName: string
  name: string
  unique?: boolean
}

export const createIndex = ({ name, columnName, unique }: CreateIndexArgs) => {
  return (table: { [x: string]: GenericColumn }) => {
    if (unique) return uniqueIndex(`${columnName}_idx`).on(table[name])
    return index(`${columnName}_idx`).on(table[name])
  }
}
