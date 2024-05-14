import type { FieldMap, MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fieldMap: FieldMap,
): MappedField[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenFieldMap(fieldMap)
    return flattenedFields.filter(
      (field) => field.isFieldAffectingData && listSearchableFields.includes(field.name),
    )
  }

  return null
}
