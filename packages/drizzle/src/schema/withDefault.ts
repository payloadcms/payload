import type { FieldAffectingData } from 'payload'

import { sql } from 'drizzle-orm'

import type { RawColumn } from '../types.js'

export const withDefault = (column: RawColumn, field: FieldAffectingData): RawColumn => {
  if (typeof field.defaultValue === 'undefined' || typeof field.defaultValue === 'function') {
    return column
  }

  return {
    ...column,
    default: field.defaultValue,
  }
}
