'use client'
import type { ClientField } from 'payload'

import { fieldAffectsData } from 'payload/shared'

export const createNestedClientFieldPath = (parentPath: string, field: ClientField): string => {
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
