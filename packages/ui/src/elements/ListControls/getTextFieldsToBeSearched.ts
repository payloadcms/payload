'use client'
import type { ClientField } from 'payload'

import { fieldAffectsData, flattenTopLevelFields } from 'payload/shared'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fields: ClientField[],
): ClientField[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenTopLevelFields(fields) as ClientField[]

    return flattenedFields.filter(
      (field) => fieldAffectsData(field) && listSearchableFields.includes(field.name),
    )
  }

  return null
}
