import type { Field, FieldWithSubFields } from './config/types.js'

import { deepMergeWithReactComponents } from '../utilities/deepMerge.js'
import { fieldAffectsData, fieldHasSubFields } from './config/types.js'

const shouldOverrideMergedOptions = ({
  baseField,
  matchedField,
}: {
  baseField: Field
  matchedField: Field
}) => {
  return (
    (baseField.type === 'radio' || baseField.type === 'select') &&
    (matchedField.type === 'radio' || matchedField.type === 'select') &&
    'options' in matchedField &&
    Array.isArray(matchedField.options)
  )
}

export const mergeBaseFields = (fields: Field[], baseFields: Field[]): Field[] => {
  const mergedFields = [...(fields || [])]

  baseFields.forEach((baseField) => {
    let matchedIndex: null | number = null

    if (fieldAffectsData(baseField)) {
      const match = mergedFields.find((field, i) => {
        if (fieldAffectsData(field) && field.name === baseField.name) {
          matchedIndex = i
          return true
        }

        return false
      })

      if (match) {
        const matchCopy: Field = { ...match }
        mergedFields.splice(matchedIndex!, 1)

        const mergedField = deepMergeWithReactComponents<Field>(baseField, matchCopy)

        if (shouldOverrideMergedOptions({ baseField, matchedField: matchCopy })) {
          mergedField.options = matchCopy.options
        }

        if (fieldHasSubFields(baseField) && fieldHasSubFields(matchCopy)) {
          ;(mergedField as FieldWithSubFields).fields = mergeBaseFields(
            matchCopy.fields,
            baseField.fields,
          )
        }

        mergedFields.push(mergedField)
      } else {
        mergedFields.push(baseField)
      }
    }
  })

  return mergedFields
}
