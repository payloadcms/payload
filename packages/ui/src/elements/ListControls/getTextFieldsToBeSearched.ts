'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { fieldAffectsData, flattenTopLevelFields } from 'payload/shared'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fields: ClientField[],
  i18n: I18nClient,
): ClientField[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenTopLevelFields(fields, {
      i18n,
      moveSubFieldsToTop: true,
    }) as ClientField[]

    const searchableFieldNames = new Set(listSearchableFields)
    const matchingFields: typeof flattenedFields = []

    for (const field of flattenedFields) {
      if (fieldAffectsData(field) && searchableFieldNames.has(field.name)) {
        matchingFields.push(field)
        searchableFieldNames.delete(field.name)
      }
    }

    return matchingFields
  }

  return null
}
