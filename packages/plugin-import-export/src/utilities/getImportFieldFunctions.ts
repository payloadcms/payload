import type { FlattenedField } from 'payload'

import type { FieldBeforeImportHook, ImportFieldHookEntry } from '../types.js'

import { registerFieldHooks } from './flattenedFields.js'

type Args = {
  fields: FlattenedField[]
}

/**
 * Builds a map from logical field path (e.g. `content_textBlock_body`) to
 * the import hook entry. Paths include block slugs but never array indices.
 */
export const getImportFieldFunctions = ({ fields }: Args): Record<string, ImportFieldHookEntry> => {
  const result: Record<string, ImportFieldHookEntry> = {}
  registerFieldHooks(fields, '', result, registerImportHandler)
  return result
}

const registerImportHandler = (
  field: FlattenedField,
  fullKey: string,
  result: Record<string, ImportFieldHookEntry>,
): void => {
  const beforeImport = field.custom?.['plugin-import-export']?.hooks?.beforeImport

  if (typeof beforeImport === 'function') {
    result[fullKey] = { type: 'beforeImport', fn: beforeImport }
    return
  }

  const registerBeforeImport = (fn: FieldBeforeImportHook) => {
    result[fullKey] = { type: 'beforeImport', fn }
  }

  if (field.type === 'relationship' || field.type === 'upload') {
    if (field.hasMany !== true) {
      if (!Array.isArray(field.relationTo)) {
        registerBeforeImport(({ value }) => value)
      }
    } else if (!Array.isArray(field.relationTo)) {
      registerBeforeImport(({ value }) => value)
    }
    return
  }

  if (field.type === 'number') {
    if (field.hasMany) {
      registerBeforeImport(({ value }) => value)
      return
    }
    registerBeforeImport(({ value }) => {
      if (isEmptyImportValue(value)) {
        return undefined
      }
      if (typeof value === 'number') {
        return value
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? undefined : parsed
      }
      return value
    })
    return
  }

  if (field.type === 'checkbox') {
    registerBeforeImport(({ value }) => {
      if (isEmptyImportValue(value)) {
        return undefined
      }
      if (typeof value === 'boolean') {
        return value
      }
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1'
      }
      return Boolean(value)
    })
    return
  }

  if (field.type === 'date') {
    registerBeforeImport(({ value }) => {
      if (isEmptyImportValue(value)) {
        return undefined
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
    })
    return
  }

  if (field.type === 'json' || field.type === 'richText') {
    registerBeforeImport(({ value }) => {
      if (isEmptyImportValue(value)) {
        return undefined
      }
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
    })
  }
}

const isEmptyImportValue = (value: unknown): boolean =>
  value === '' || value === null || value === undefined
