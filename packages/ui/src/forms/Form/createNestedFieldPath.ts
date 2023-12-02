import type { Field } from 'payload/types'

import { fieldAffectsData } from 'payload/types'

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
