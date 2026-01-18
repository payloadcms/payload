import type { FieldAffectingData } from '@ruya.sa/payload'

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
