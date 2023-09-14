import merge from 'deepmerge'

import type { Field, FieldWithSubFields } from './config/types'

import { fieldAffectsData, fieldHasSubFields } from './config/types'

const mergeBaseFields = (fields: Field[], baseFields: Field[]): Field[] => {
  const mergedFields = [...(fields || [])]

  baseFields.forEach((baseField) => {
    let matchedIndex = null

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
        mergedFields.splice(matchedIndex, 1)

        const mergedField = merge<Field>(baseField, matchCopy)

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

export default mergeBaseFields
