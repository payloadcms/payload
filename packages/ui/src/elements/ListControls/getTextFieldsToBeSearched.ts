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

    return flattenedFields.filter(
      (field) => fieldAffectsData(field) && listSearchableFields.includes(field.name),
    )
  }

  return null
}
