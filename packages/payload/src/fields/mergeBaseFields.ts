import type { Field, FieldWithSubFields, Option, RadioField, SelectField } from './config/types.js'

import { deepMergeWithReactComponents } from '../utilities/deepMerge.js'
import { fieldAffectsData, fieldHasSubFields } from './config/types.js'

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

        if (fieldHasOptions(baseField) && fieldHasOptions(matchCopy)) {
          ;(mergedField as RadioField | SelectField).options = mergeOptionsByValue({
            baseOptions: baseField.options,
            overrideOptions: matchCopy.options,
          })
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

const fieldHasOptions = (field: Field): field is RadioField | SelectField =>
  (field.type === 'radio' || field.type === 'select') && Array.isArray(field.options)

const getOptionValue = (option: Option): string =>
  typeof option === 'string' ? option : option.value

/**
 * Keeps every base option, lets an override replace a base option with the same value
 * (e.g. to change its label), and appends override options the base does not have.
 * Concatenating instead would duplicate values, which produces invalid database enums.
 */
const mergeOptionsByValue = ({
  baseOptions,
  overrideOptions,
}: {
  baseOptions: Option[]
  overrideOptions: Option[]
}): Option[] => {
  const overridesByValue = new Map(
    overrideOptions.map((option) => [getOptionValue(option), option]),
  )
  const baseValues = new Set(baseOptions.map(getOptionValue))

  return [
    ...baseOptions.map((option) => overridesByValue.get(getOptionValue(option)) ?? option),
    ...overrideOptions.filter((option) => !baseValues.has(getOptionValue(option))),
  ]
}
