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
  const result: Record<string, ToCSVFunction> = {}

  const buildCustomFunctions: TraverseFieldsCallback = ({ field, parentRef, ref }) => {
    // @ts-expect-error ref is untyped
    ref.prefix = parentRef.prefix || ''
    if (field.type === 'group' || field.type === 'tab') {
      // @ts-expect-error ref is untyped
      const parentPrefix = parentRef?.prefix ? `${parentRef.prefix}_` : ''
      // @ts-expect-error ref is untyped
      ref.prefix = `${parentPrefix}${field.name}_`
    }

    if (typeof field.custom?.['plugin-import-export']?.toCSV === 'function') {
      // @ts-expect-error ref is untyped
      result[`${ref.prefix}${field.name}`] = field.custom['plugin-import-export']?.toCSV
    } else if (field.type === 'relationship' || field.type === 'upload') {
      if (field.hasMany !== true) {
        if (!Array.isArray(field.relationTo)) {
          // monomorphic single
          // @ts-expect-error ref is untyped
          result[`${ref.prefix}${field.name}`] = ({ value }) =>
            typeof value === 'object' && value && 'id' in value ? value.id : value
        } else {
          // polymorphic single
          // @ts-expect-error ref is untyped
          result[`${ref.prefix}${field.name}`] = ({ data, value }) => {
            // @ts-expect-error ref is untyped
            data[`${ref.prefix}${field.name}_id`] = value.id
            // @ts-expect-error ref is untyped
            data[`${ref.prefix}${field.name}_relationTo`] = value.relationTo
            return undefined
          }
        }
      } else {
        if (!Array.isArray(field.relationTo)) {
          // monomorphic many
          // @ts-expect-error ref is untyped
          result[`${ref.prefix}${field.name}`] = ({
            value,
          }: {
            value: Record<string, unknown>[]
          }) =>
            value.map((val: number | Record<string, unknown> | string) =>
              typeof val === 'object' ? val.id : val,
            )
        } else {
          // polymorphic many
          // @ts-expect-error ref is untyped
          result[`${ref.prefix}${field.name}`] = ({
            data,
            value,
          }: {
            data: Record<string, unknown>
            value: Record<string, unknown>[]
          }) =>
            value.map((val: number | Record<string, unknown> | string, i) => {
              // @ts-expect-error ref is untyped
              data[`${ref.prefix}${field.name}_${i}_id`] = val.id
              // @ts-expect-error ref is untyped
              data[`${ref.prefix}${field.name}_${i}_relationTo`] = val.relationTo
              return undefined
            })
        }
      }
    }

    // TODO: do this so we only return the functions needed based on the select used
    ////@ts-expect-error ref is untyped
    // ref.select = typeof select !== 'undefined' || select[field.name] ? select : {}
  }

  traverseFields({ callback: buildCustomFunctions, fields })

  return result
}
