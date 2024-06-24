import type { Field } from 'payload/types'

import { fieldAffectsData } from 'payload/types'

import type { MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'

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

export const createNestedClientFieldPath = (parentPath: string, field: MappedField): string => {
  if (parentPath) {
    if (field.isFieldAffectingData) {
      return `${parentPath}.${field.name}`
    }
  }

  if (field.isFieldAffectingData) {
    return field.name
  }

  return field.name
}
