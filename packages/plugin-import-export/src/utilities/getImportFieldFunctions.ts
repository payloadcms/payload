import type { FlattenedField } from 'payload'

import type { FieldBeforeImportHook } from '../types.js'

type Args = {
  fields: FlattenedField[]
}

/**
 * Returns a map from logical path (e.g. `content_textBlock_body`) to the
 * import hook to apply at that path. Paths include block slugs but never
 * array indices.
 */
export const getImportFieldFunctions = ({
  fields,
}: Args): Record<string, FieldBeforeImportHook> => {
  const result: Record<string, FieldBeforeImportHook> = {}

  registerImportHooks(fields, '', result)

  return result
}

const registerImportHooks = (
  fields: FlattenedField[],
  parentPath: string,
  result: Record<string, FieldBeforeImportHook>,
): void => {
  for (const field of fields) {
    if (!('name' in field) || !field.name) {
      continue
    }

    if (field.type === 'blocks') {
      const base = parentPath ? `${parentPath}_${field.name}` : field.name
      for (const block of field.blocks ?? []) {
        const blockFields = (block as { flattenedFields?: FlattenedField[] }).flattenedFields ?? []
        registerImportHooks(blockFields, `${base}_${block.slug}`, result)
      }
      continue
    }

    const fullKey = parentPath ? `${parentPath}_${field.name}` : field.name
    registerImportHandler(field, fullKey, result)

    if (field.type === 'group' || field.type === 'tab' || field.type === 'array') {
      const nestedFields = (field as { flattenedFields?: FlattenedField[] }).flattenedFields ?? []
      registerImportHooks(nestedFields, fullKey, result)
    }
  }
}

const registerImportHandler = (
  field: FlattenedField,
  fullKey: string,
  result: Record<string, FieldBeforeImportHook>,
): void => {
  const userHook =
    field.custom?.['plugin-import-export']?.hooks?.beforeImport ??
    field.custom?.['plugin-import-export']?.fromCSV

  if (typeof userHook === 'function') {
    result[fullKey] = userHook
    return
  }

  if (field.type === 'relationship' || field.type === 'upload') {
    if (field.hasMany !== true) {
      if (!Array.isArray(field.relationTo)) {
        result[fullKey] = ({ value }) => value
      }
    } else if (!Array.isArray(field.relationTo)) {
      result[fullKey] = ({ value }) => value
    }
    return
  }

  if (field.type === 'number') {
    if (field.hasMany) {
      result[fullKey] = ({ value }) => value
      return
    }
    result[fullKey] = ({ value }) => {
      if (typeof value === 'number') {
        return value
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? 0 : parsed
      }
      return value
    }
    return
  }

  if (field.type === 'checkbox') {
    result[fullKey] = ({ value }) => {
      if (typeof value === 'boolean') {
        return value
      }
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1'
      }
      return Boolean(value)
    }
    return
  }

  if (field.type === 'date') {
    result[fullKey] = ({ value }) => {
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
    return
  }

  if (field.type === 'json' || field.type === 'richText') {
    result[fullKey] = ({ value }) => {
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
