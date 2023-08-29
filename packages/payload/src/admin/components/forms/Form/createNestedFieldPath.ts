import type { Field } from '../../../../fields/config/types.js'

import { fieldAffectsData } from '../../../../fields/config/types.js'

export const createNestedFieldPath = (parentPath: string, field: Field): string => {
  if (parentPath) {
    if (fieldAffectsData(field)) {
      return `${parentPath}.${field.name}`
    }

    return parentPath
  }

  if (fieldAffectsData(field)) {
    return field.name
  }

  return ''
}
