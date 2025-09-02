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

    const wanted = new Set(listSearchableFields)
    const result: typeof flattenedFields = []

    for (const field of flattenedFields) {
      if (fieldAffectsData(field) && wanted.has(field.name)) {
        result.push(field)
        wanted.delete(field.name)
      }
    }

    return result
  }

  return null
}
