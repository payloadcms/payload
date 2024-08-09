import type { ClientField } from 'payload'

import { fieldAffectsData } from 'payload/shared'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fields: ClientField[],
): ClientField[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenFieldMap(fields)
    return flattenedFields.filter(
      (field) => fieldAffectsData(field) && listSearchableFields.includes(field.name),
    )
  }

  return null
}
