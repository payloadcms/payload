import type { FlattenedField } from 'payload'

import type { ExportFieldHookEntry, FieldBeforeExportHook } from '../types.js'

import { registerFieldHooks } from './flattenedFields.js'
import { getPolymorphicRelId, isPolymorphicRelValue } from './polymorphicRel.js'

type Args = {
  fields: FlattenedField[]
}

/**
 * Builds a map from logical field path (e.g. `content_textBlock_body`) to
 * the export hook entry. Paths include block slugs but never array indices.
 */
export const getExportFieldFunctions = ({ fields }: Args): Record<string, ExportFieldHookEntry> => {
  const result: Record<string, ExportFieldHookEntry> = {}
  registerFieldHooks(fields, '', result, registerExportHandler)
  return result
}

const registerExportHandler = (
  field: FlattenedField,
  fullKey: string,
  result: Record<string, ExportFieldHookEntry>,
): void => {
  const beforeExport = field.custom?.['plugin-import-export']?.hooks?.beforeExport

  if (typeof beforeExport === 'function') {
    result[fullKey] = { type: 'beforeExport', fn: beforeExport }
    return
  }

  const registerHandler = (handler: FieldBeforeExportHook) => {
    result[fullKey] = { type: 'beforeExport', fn: handler }
  }

  if (field.type === 'json' || field.type === 'richText') {
    registerHandler(({ format, value }) => {
      if (format === 'json') {
        return value
      }
      if (value === null || value === undefined) {
        return value
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      return value
    })
    return
  }

  if (field.type === 'date') {
    registerHandler(({ value }) => value)
    return
  }

  if (field.type !== 'relationship' && field.type !== 'upload') {
    return
  }

  if (field.hasMany !== true) {
    if (!Array.isArray(field.relationTo)) {
      registerHandler(({ value }) =>
        typeof value === 'object' && value && 'id' in value ? value.id : value,
      )
      return
    }

    registerHandler(({ siblingData, value }) => {
      if (isPolymorphicRelValue(value)) {
        const id = getPolymorphicRelId(value)
        if (id !== undefined) {
          siblingData[`${fullKey}_id`] = id
          siblingData[`${fullKey}_relationTo`] = value.relationTo
        }
      }
      return null
    })
    return
  }

  if (!Array.isArray(field.relationTo)) {
    registerHandler(({ siblingData, value }) => {
      if (Array.isArray(value)) {
        value.forEach((val, i) => {
          const id = typeof val === 'object' && val ? (val as { id: unknown }).id : val
          siblingData[`${fullKey}_${i}_id`] = id
        })
        return null
      }
      return undefined
    })
    return
  }

  registerHandler(({ siblingData, value }) => {
    if (Array.isArray(value)) {
      value.forEach((val, i) => {
        if (isPolymorphicRelValue(val)) {
          const id = getPolymorphicRelId(val)
          if (id !== undefined) {
            siblingData[`${fullKey}_${i}_id`] = id
            siblingData[`${fullKey}_${i}_relationTo`] = val.relationTo
          }
        }
      })
      return null
    }
    return undefined
  })
}
