import {
  type FlattenedField,
  type SelectIncludeType,
  traverseFields,
  type TraverseFieldsCallback,
} from 'payload'

import type { ToCSVFunction } from '../types.js'

type Args = {
  fields: FlattenedField[]
  select: SelectIncludeType | undefined
}

export const getCustomFieldFunctions = ({
  fields,
  select,
}: Args): Record<string, ToCSVFunction> => {
  const result = {}

  const buildCustomFunctions: TraverseFieldsCallback = ({ field, parentRef, ref }) => {
    // @ts-expect-error ref is untyped
    ref.prefix = ''
    if (field.type === 'group' || field.type === 'tab') {
      // @ts-expect-error ref is untyped
      const parentPrefix = parentRef?.prefix ? `${parentRef.prefix}_` : ''
      // @ts-expect-error ref is untyped
      ref.prefix = `${parentPrefix}${field.name}`
    }

    if (typeof field.custom?.['plugin-import-export']?.toCSV === 'function') {
      // @ts-expect-error ref is untyped
      result[`${ref.prefix}${field.name}`] = field.custom['plugin-import-export']?.toCSV
    }

    // TODO: do this so we only return the functions needed based on the select used
    ////@ts-expect-error ref is untyped
    // ref.select = typeof select !== 'undefined' || select[field.name] ? select : {}

    // if (typeof field.custom?.['plugin-import-export']?.toCSV === 'function') {
    //   // @ts-expect-error ref is untyped
    //   result[toCSVColumnName(ref.prefix)] = field.custom['plugin-import-export']?.toCSV
    // }
  }

  traverseFields({ callback: buildCustomFunctions, fields })

  return result
}
