import type { FieldAffectingData } from 'payload'

import type { RawColumn } from '../types.js'

export const withDefault = (
  column: RawColumn,
  field: FieldAffectingData,
  isLocaleColumn = false,
): RawColumn => {
  if (
    isLocaleColumn ||
    typeof field.defaultValue === 'undefined' ||
    typeof field.defaultValue === 'function'
  ) {
    return column
  }

  return {
    ...column,
    default: field.defaultValue,
  }
}
