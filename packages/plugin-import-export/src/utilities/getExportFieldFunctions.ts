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

    registerHandler(({ format, siblingData, value }) => {
      // A shape this handler does not recognize is left untouched for JSON, which holds the
      // source value verbatim. CSV still clears it, since its id/relationTo would otherwise
      // land in sibling columns.
      if (!isPolymorphicRelValue(value)) {
        return format === 'json' ? undefined : null
      }

      // A recognized reference that resolves to no id is dangling, and a dangling reference
      // cannot be imported back — clear it for both formats.
      const id = getPolymorphicRelId(value)
      if (id === undefined) {
        return null
      }

      if (format === 'json') {
        return { relationTo: value.relationTo, value: id }
      }
      siblingData[`${fullKey}_id`] = id
      siblingData[`${fullKey}_relationTo`] = value.relationTo
      return null
    })
    return
  }

  if (!Array.isArray(field.relationTo)) {
    registerHandler(({ format, siblingData, value }) => {
      if (!Array.isArray(value)) {
        return undefined
      }
      const ids = value.map((val) =>
        typeof val === 'object' && val ? (val as { id: unknown }).id : val,
      )
      // Bare null entries fail relationship validation when the JSON is imported, so drop
      // references that could not be resolved. CSV keeps source indexes in its column names;
      // unflattening those columns collapses any gaps on import.
      if (format === 'json') {
        return ids.filter((id) => id !== null && id !== undefined)
      }
      ids.forEach((id, i) => {
        siblingData[`${fullKey}_${i}_id`] = id
      })
      return null
    })
    return
  }

  registerHandler(({ format, siblingData, value }) => {
    if (!Array.isArray(value)) {
      return undefined
    }
    // `index` is carried so CSV columns stay pinned to the source position: an entry
    // that cannot be resolved to an id leaves a gap rather than shifting its siblings.
    const rels = value.flatMap((val, index) => {
      if (!isPolymorphicRelValue(val)) {
        return []
      }
      const id = getPolymorphicRelId(val)
      return id === undefined ? [] : [{ id, index, relationTo: val.relationTo }]
    })

    if (format === 'json') {
      // Bare null entries fail relationship validation when the JSON is imported, so return
      // only references that resolved to an id.
      return rels.map(({ id, relationTo }) => ({ relationTo, value: id }))
    }
    rels.forEach(({ id, index, relationTo }) => {
      siblingData[`${fullKey}_${index}_id`] = id
      siblingData[`${fullKey}_${index}_relationTo`] = relationTo
    })
    return null
  })
}
