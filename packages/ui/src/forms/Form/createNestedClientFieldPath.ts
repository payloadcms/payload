'use client'
import type { ClientField } from '@ruya.sa/payload'

import { fieldAffectsData } from '@ruya.sa/payload/shared'

export const createNestedClientFieldPath = (parentPath: string, field: ClientField): string => {
  if (parentPath) {
    if (fieldAffectsData(field) && field.name) {
      return `${parentPath}.${field.name}`
    }
    return parentPath
  }

  if (fieldAffectsData(field)) {
    return field.name
  }

  return ''
}
