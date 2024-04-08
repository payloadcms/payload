import { flattenFieldMap } from '@payloadcms/ui/utilities/flattenFieldMap'

import type { FieldMap, MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'

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
