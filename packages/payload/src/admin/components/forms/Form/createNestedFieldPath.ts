import type { Field } from '../../../../fields/config/types'

import { fieldAffectsData } from '../../../../fields/config/types'

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
