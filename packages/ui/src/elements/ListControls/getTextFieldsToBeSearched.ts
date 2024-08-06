import type { ClientFieldConfig } from 'payload'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fields: ClientFieldConfig[],
): ClientFieldConfig[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenFieldMap(fields)
    return flattenedFields.filter(
      (field) => field.isFieldAffectingData && listSearchableFields.includes(field.name),
    )
  }

  return null
}
