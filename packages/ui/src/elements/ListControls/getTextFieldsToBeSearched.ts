import type { I18nClient } from '@payloadcms/translations'
import type { FieldMap, MappedField } from 'payload'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fieldMap: FieldMap,
  i18n: I18nClient,
): MappedField[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenFieldMap({ fieldMap, i18n })
    return flattenedFields.filter(
      (field) => field.isFieldAffectingData && listSearchableFields.includes(field.name),
    )
  }

  return null
}
