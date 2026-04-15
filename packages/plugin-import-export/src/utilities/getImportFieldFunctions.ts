import { type FlattenedField, traverseFields, type TraverseFieldsCallback } from 'payload'

import type { FieldImportHook } from '../types.js'

type Args = {
  fields: FlattenedField[]
}

/**
 * Builds the underscore-separated column key from traverseFields' dot-separated parentPath.
 */
const buildFieldKey = (parentPath: string, fieldName: string): string => {
  const prefix = parentPath.replace(/\./g, '_').replace(/_$/, '')
  return prefix ? `${prefix}_${fieldName}` : fieldName
}

/**
 * Gets field-level import hook functions for unflattening data during import.
 * Checks the new `import` property first, falls back to deprecated `fromCSV`.
 */
export const getImportFieldFunctions = ({ fields }: Args): Record<string, FieldImportHook> => {
  const result: Record<string, FieldImportHook> = {}

  const buildCustomFunctions: TraverseFieldsCallback = ({ field, parentPath }) => {
    if (!('name' in field) || !field.name) {
      return
    }

    const key = buildFieldKey(parentPath, field.name)

    // New `import` property takes priority over deprecated `fromCSV`
    const fieldImportHook =
      field.custom?.['plugin-import-export']?.import ??
      field.custom?.['plugin-import-export']?.fromCSV

    if (typeof fieldImportHook === 'function') {
      result[key] = fieldImportHook as FieldImportHook
      return
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      if (field.hasMany !== true) {
        if (!Array.isArray(field.relationTo)) {
          result[key] = ({ value }) => {
            if (typeof value === 'object' && value !== null) {
              return value
            }
            return value
          }
        }
      } else {
        if (!Array.isArray(field.relationTo)) {
          result[key] = ({ value }) => {
            if (Array.isArray(value)) {
              return value
            }
            return value
          }
        }
      }
    } else if (field.type === 'number') {
      if (field.hasMany) {
        result[key] = ({ value }) => value
      } else {
        result[key] = ({ value }) => {
          if (typeof value === 'number') {
            return value
          }
          if (typeof value === 'string') {
            const parsed = parseFloat(value)
            return isNaN(parsed) ? 0 : parsed
          }
          return value
        }
      }
    } else if (field.type === 'checkbox') {
      result[key] = ({ value }) => {
        if (typeof value === 'boolean') {
          return value
        }
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1'
        }
        return Boolean(value)
      }
    } else if (field.type === 'date') {
      result[key] = ({ value }) => {
        if (!value) {
          return value
        }
        if (typeof value === 'string' && !isNaN(Date.parse(value))) {
          return value
        }
        try {
          const date = new Date(value as string)
          return isNaN(date.getTime()) ? value : date.toISOString()
        } catch {
          return value
        }
      }
    } else if (field.type === 'json' || field.type === 'richText') {
      result[key] = ({ value }) => {
        if (typeof value === 'object') {
          return value
        }
        if (typeof value === 'string') {
          try {
            return JSON.parse(value)
          } catch {
            return value
          }
        }
        return value
      }
    }
  }

  traverseFields({ callback: buildCustomFunctions, fields })

  return result
}
