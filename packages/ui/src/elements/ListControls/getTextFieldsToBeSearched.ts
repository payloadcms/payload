import type { ClientFieldConfig } from 'payload'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  field: ClientFieldConfig,
): ClientFieldConfig[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenFieldMap(field)
    return flattenedFields.filter(
      (field) => field.isFieldAffectingData && listSearchableFields.includes(field.name),
    )
  }

  return null
}
