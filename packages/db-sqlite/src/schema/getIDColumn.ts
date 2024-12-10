import { integer, numeric, text } from 'drizzle-orm/sqlite-core'

import type { IDType } from '../types.js'

export const getIDColumn = ({
  name,
  type,
  notNull,
  primaryKey,
}: {
  name: string
  notNull?: boolean
  primaryKey: boolean
  type: IDType
}) => {
  let column
  switch (type) {
    case 'integer':
      column = integer(name)
      break
    case 'numeric':
      column = numeric(name)
      break
    case 'text':
      column = text(name)
      break
  }

  if (notNull) {
    column.notNull()
  }

  if (primaryKey) {
    column.primaryKey()
  }

  return column
}
