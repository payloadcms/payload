import { type FlattenedField, traverseFields, type TraverseFieldsCallback } from 'payload'

import type { ToCSVFunction } from '../types.js'

type Args = {
  fields: FlattenedField[]
}

export const getCustomFieldFunctions = ({ fields }: Args): Record<string, ToCSVFunction> => {
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
            if (value && typeof value === 'object' && 'relationTo' in value && 'value' in value) {
              const relationTo = (value as { relationTo: string; value: { id: number | string } })
                .relationTo
              const relatedDoc = (value as { relationTo: string; value: { id: number | string } })
                .value
              if (relatedDoc && typeof relatedDoc === 'object') {
                // @ts-expect-error ref is untyped
                data[`${ref.prefix}${field.name}_id`] = relatedDoc.id
                // @ts-expect-error ref is untyped
                data[`${ref.prefix}${field.name}_relationTo`] = relationTo
              }
            }
            return undefined // prevents further flattening
          }
        }
      } else {
        if (!Array.isArray(field.relationTo)) {
          // monomorphic many
          // @ts-expect-error ref is untyped
          result[`${ref.prefix}${field.name}`] = ({
            data,
            value,
          }: {
            data: Record<string, unknown>
            value: Array<number | Record<string, any> | string> | undefined
          }) => {
            if (Array.isArray(value)) {
              value.forEach((val, i) => {
                const id = typeof val === 'object' && val ? val.id : val
                // @ts-expect-error ref is untyped
                data[`${ref.prefix}${field.name}_${i}_id`] = id
              })
            }
            return undefined // prevents further flattening
          }
        } else {
          // polymorphic many
          // @ts-expect-error ref is untyped
          result[`${ref.prefix}${field.name}`] = ({
            data,
            value,
          }: {
            data: Record<string, unknown>
            value: Array<Record<string, any>> | undefined
          }) => {
            if (Array.isArray(value)) {
              value.forEach((val, i) => {
                if (val && typeof val === 'object') {
                  const relationTo = val.relationTo
                  const relatedDoc = val.value
                  if (relationTo && relatedDoc && typeof relatedDoc === 'object') {
                    // @ts-expect-error ref is untyped
                    data[`${ref.prefix}${field.name}_${i}_id`] = relatedDoc.id
                    // @ts-expect-error ref is untyped
                    data[`${ref.prefix}${field.name}_${i}_relationTo`] = relationTo
                  }
                }
              })
            }
            return undefined
          }
        }
      }
    }
  }

  traverseFields({ callback: buildCustomFunctions, fields })

  return result
}
