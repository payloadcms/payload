import { type FlattenedField, traverseFields, type TraverseFieldsCallback } from 'payload'

import type { FieldExportHook } from '../types.js'

type Args = {
  fields: FlattenedField[]
}

/**
 * Builds the underscore-separated column key from traverseFields' dot-separated parentPath.
 * e.g. parentPath='group.namedTab.' + name='deepField' → 'group_namedTab_deepField'
 */
const buildFieldKey = (parentPath: string, fieldName: string): string => {
  const prefix = parentPath.replace(/\./g, '_').replace(/_$/, '')
  return prefix ? `${prefix}_${fieldName}` : fieldName
}

/**
 * Gets field-level export hook functions for flattening documents during export.
 * Checks the new `export` property first, falls back to deprecated `toCSV`.
 *
 * Default handlers (json, richText, date, relationship) are registered under both the full path
 * key and the base field name so that flattenObject's fallback lookup works for dynamic paths
 * inside blocks/arrays (e.g. 'blocks_0_content_richText' → fallback to 'richText').
 *
 * User-defined hooks are registered under the full path only.
 */
export const getExportFieldFunctions = ({ fields }: Args): Record<string, FieldExportHook> => {
  const result: Record<string, FieldExportHook> = {}

  const buildCustomFunctions: TraverseFieldsCallback = ({ field, parentPath }) => {
    if (!('name' in field) || !field.name) {
      return
    }

    const fullKey = buildFieldKey(parentPath, field.name)
    const baseKey = field.name

    // New `export` property takes priority over deprecated `toCSV`
    const fieldExportHook =
      field.custom?.['plugin-import-export']?.export ??
      field.custom?.['plugin-import-export']?.toCSV

    if (typeof fieldExportHook === 'function') {
      result[fullKey] = fieldExportHook as FieldExportHook
      return
    }

    if (field.type === 'json' || field.type === 'richText') {
      const handler: FieldExportHook = ({ value }) => {
        if (value === null || value === undefined) {
          return value
        }
        if (typeof value === 'object') {
          return JSON.stringify(value)
        }
        return value
      }
      result[fullKey] = handler
      if (fullKey !== baseKey) {
        result[baseKey] = handler
      }
    } else if (field.type === 'date') {
      const handler: FieldExportHook = ({ value }) => value
      result[fullKey] = handler
      if (fullKey !== baseKey) {
        result[baseKey] = handler
      }
    } else if (field.type === 'relationship' || field.type === 'upload') {
      if (field.hasMany !== true) {
        if (!Array.isArray(field.relationTo)) {
          const handler: FieldExportHook = ({ value }) =>
            typeof value === 'object' && value && 'id' in value ? value.id : value
          result[fullKey] = handler
          if (fullKey !== baseKey) {
            result[baseKey] = handler
          }
        } else {
          const handler: FieldExportHook = ({ data, value }) => {
            if (value && typeof value === 'object' && 'relationTo' in value && 'value' in value) {
              const typed = value as { relationTo: string; value: { id: number | string } }
              if (typed.value && typeof typed.value === 'object') {
                data[`${fullKey}_id`] = typed.value.id
                data[`${fullKey}_relationTo`] = typed.relationTo
              }
            }
            return undefined
          }
          result[fullKey] = handler
          if (fullKey !== baseKey) {
            result[baseKey] = handler
          }
        }
      } else {
        if (!Array.isArray(field.relationTo)) {
          const handler: FieldExportHook = ({ data, value }) => {
            const arr = value as Array<number | Record<string, unknown> | string> | undefined
            if (Array.isArray(arr)) {
              arr.forEach((val, i) => {
                const id = typeof val === 'object' && val ? val.id : val
                data[`${fullKey}_${i}_id`] = id
              })
            }
            return undefined
          }
          result[fullKey] = handler
          if (fullKey !== baseKey) {
            result[baseKey] = handler
          }
        } else {
          const handler: FieldExportHook = ({ data, value }) => {
            const arr = value as Array<Record<string, unknown>> | undefined
            if (Array.isArray(arr)) {
              arr.forEach((val, i) => {
                if (val && typeof val === 'object') {
                  const relationTo = val.relationTo
                  const relatedDoc = val.value as Record<string, unknown> | undefined
                  if (relationTo && relatedDoc && typeof relatedDoc === 'object') {
                    data[`${fullKey}_${i}_id`] = relatedDoc.id
                    data[`${fullKey}_${i}_relationTo`] = relationTo
                  }
                }
              })
            }
            return undefined
          }
          result[fullKey] = handler
          if (fullKey !== baseKey) {
            result[baseKey] = handler
          }
        }
      }
    }
  }

  traverseFields({ callback: buildCustomFunctions, fields })

  return result
}
