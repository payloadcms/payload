import type { FlattenedField } from 'payload'

import type { FieldBeforeExportHook } from '../types.js'

type Args = {
  fields: FlattenedField[]
}

/**
 * Returns a map from logical path (e.g. `content_textBlock_body`) to the
 * export hook to apply at that path. Paths include block slugs but never
 * array indices.
 */
export const getExportFieldFunctions = ({
  fields,
}: Args): Record<string, FieldBeforeExportHook> => {
  const result: Record<string, FieldBeforeExportHook> = {}

  registerExportHooks(fields, '', result)

  return result
}

const registerExportHooks = (
  fields: FlattenedField[],
  parentPath: string,
  result: Record<string, FieldBeforeExportHook>,
): void => {
  for (const field of fields) {
    if (!('name' in field) || !field.name) {
      continue
    }

    if (field.type === 'blocks') {
      const blocksField = field
      const base = parentPath ? `${parentPath}_${field.name}` : field.name
      for (const block of blocksField.blocks ?? []) {
        const blockFields = (block as { flattenedFields?: FlattenedField[] }).flattenedFields ?? []
        registerExportHooks(blockFields, `${base}_${block.slug}`, result)
      }
      continue
    }

    const fullKey = parentPath ? `${parentPath}_${field.name}` : field.name
    registerExportHandler(field, fullKey, result)

    if (field.type === 'group' || field.type === 'tab' || field.type === 'array') {
      const nestedFields = (field as { flattenedFields?: FlattenedField[] }).flattenedFields ?? []
      registerExportHooks(nestedFields, fullKey, result)
    }
  }
}

const registerExportHandler = (
  field: FlattenedField,
  fullKey: string,
  result: Record<string, FieldBeforeExportHook>,
): void => {
  const baseKey = (field as { name: string }).name

  const userHook =
    field.custom?.['plugin-import-export']?.hooks?.beforeExport ??
    field.custom?.['plugin-import-export']?.toCSV

  if (typeof userHook === 'function') {
    result[fullKey] = userHook
    return
  }

  const registerWithBaseFallback = (handler: FieldBeforeExportHook) => {
    result[fullKey] = handler
    if (fullKey !== baseKey) {
      result[baseKey] = handler
    }
  }

  if (field.type === 'json' || field.type === 'richText') {
    registerWithBaseFallback(({ format, value }) => {
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
    registerWithBaseFallback(({ value }) => value)
    return
  }

  if (field.type !== 'relationship' && field.type !== 'upload') {
    return
  }

  if (field.hasMany !== true) {
    if (!Array.isArray(field.relationTo)) {
      registerWithBaseFallback(({ value }) =>
        typeof value === 'object' && value && 'id' in value ? value.id : value,
      )
      return
    }

    registerWithBaseFallback(({ siblingData, value }) => {
      if (value && typeof value === 'object' && 'relationTo' in value && 'value' in value) {
        const typed = value as { relationTo: string; value: { id: number | string } }
        if (typed.value && typeof typed.value === 'object') {
          siblingData[`${fullKey}_id`] = typed.value.id
          siblingData[`${fullKey}_relationTo`] = typed.relationTo
        }
      }
      return undefined
    })
    return
  }

  if (!Array.isArray(field.relationTo)) {
    registerWithBaseFallback(({ siblingData, value }) => {
      const arr = value as Array<number | Record<string, unknown> | string> | undefined
      if (Array.isArray(arr)) {
        arr.forEach((val, i) => {
          const id = typeof val === 'object' && val ? val.id : val
          siblingData[`${fullKey}_${i}_id`] = id
        })
      }
      return undefined
    })
    return
  }

  registerWithBaseFallback(({ siblingData, value }) => {
    const arr = value as Array<Record<string, unknown>> | undefined
    if (Array.isArray(arr)) {
      arr.forEach((val, i) => {
        if (val && typeof val === 'object') {
          const relationTo = val.relationTo
          const relatedDoc = val.value as Record<string, unknown> | undefined
          if (relationTo && relatedDoc && typeof relatedDoc === 'object') {
            siblingData[`${fullKey}_${i}_id`] = relatedDoc.id
            siblingData[`${fullKey}_${i}_relationTo`] = relationTo
          }
        }
      })
    }
    return undefined
  })
}
