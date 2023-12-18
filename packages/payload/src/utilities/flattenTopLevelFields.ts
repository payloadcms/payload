import type { Field, FieldAffectingData, FieldPresentationalOnly } from '../fields/config/types'

import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsPresentationalOnly,
  tabHasName,
} from '../fields/config/types'

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
const flattenFields = (
  fields: Field[],
  keepPresentationalFields?: boolean,
): (FieldAffectingData | FieldPresentationalOnly)[] => {
  return fields.reduce((fieldsToUse, field) => {
    if (fieldAffectsData(field) || (keepPresentationalFields && fieldIsPresentationalOnly(field))) {
      return [...fieldsToUse, field]
    }

    if (fieldHasSubFields(field)) {
      return [...fieldsToUse, ...flattenFields(field.fields, keepPresentationalFields)]
    }

    if (field.type === 'tabs') {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          return [
            ...tabFields,
            ...(tabHasName(tab)
              ? [{ ...tab, type: 'tab' }]
              : flattenFields(tab.fields, keepPresentationalFields)),
          ]
        }, []),
      ]
    }
    return fieldsToUse
  }, [])
}

export default flattenFields
