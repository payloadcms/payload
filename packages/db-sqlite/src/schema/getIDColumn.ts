import { integer, numeric, text } from 'drizzle-orm/sqlite-core'

import type { IDType } from '../types.js'

export const getIDColumn = ({
  name,
  type,
  notNull,
}: {
  name: string
  notNull?: boolean
  type: IDType
}) => {
  let column
  switch (type) {
    case 'integer':
      column = integer(name).primaryKey()
      break
    case 'numeric':
      column = numeric(name).primaryKey()
      break
    case 'text':
      column = text(name).primaryKey()
      break
  }
  if (notNull) {
    column.notNull()
  }
  return column
}
