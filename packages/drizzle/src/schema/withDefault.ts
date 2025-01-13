import type { FieldAffectingData } from 'payload'

import type { RawColumn } from '../types.js'

export const withDefault = (column: RawColumn, field: FieldAffectingData): RawColumn => {
  if (typeof field.defaultValue === 'undefined' || typeof field.defaultValue === 'function') {
    return column
  }

  if (typeof field.defaultValue === 'string' && field.defaultValue.includes("'")) {
    const escapedString = field.defaultValue.replaceAll("'", "''")
    return {
      ...column,
      default: escapedString,
    }
  }

  return {
    ...column,
    default: field.defaultValue,
  }
}
