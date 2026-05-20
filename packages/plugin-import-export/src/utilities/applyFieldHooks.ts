import type { FlattenedField, PayloadRequest } from 'payload'

import type {
  ExportFieldHookEntry,
  FieldBeforeExportHook,
  FieldBeforeImportHook,
  ImportFieldHookEntry,
} from '../types.js'

import { isPlainObject } from './isPlainObject.js'

export type FieldHook = FieldBeforeExportHook | FieldBeforeImportHook

export type FieldHookEntry = ExportFieldHookEntry | ImportFieldHookEntry

const joinPath = (parent: string | undefined, segment: string): string =>
  parent ? `${parent}_${segment}` : segment

export type Args = {
  data: Record<string, unknown>
  fieldHooks: Record<string, FieldHookEntry>
  fields: FlattenedField[]
  format: 'csv' | 'json' | ({} & string)
  operation: 'export' | 'import'
  req: PayloadRequest
  type: 'beforeExport' | 'beforeImport'
}

const operationLabel = { export: 'Export', import: 'Import' } as const

type TraverseArgs = {
  path: string | undefined
  schemaPath: string | undefined
  siblingData: Record<string, unknown>
} & Args

const traverseFields = ({
  type,
  data,
  fieldHooks,
  fields,
  format,
  operation,
  path,
  req,
  schemaPath,
  siblingData,
}: TraverseArgs): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...siblingData }

  for (const field of fields) {
    if (!('name' in field) || !field.name) {
      continue
    }

    const fieldPath = joinPath(path, field.name)
    const fieldSchemaPath = joinPath(schemaPath, field.name)
    const entry = fieldHooks[fieldSchemaPath]
    const hook = entry?.type === type ? (entry.fn as FieldHook) : undefined

    if (typeof hook === 'function' && field.name in result) {
      try {
        const transformed = hook({
          columnName: fieldPath,
          data,
          format,
          siblingData: result,
          siblingDoc: siblingData,
          value: result[field.name],
        })

        if (typeof transformed !== 'undefined') {
          result[field.name] = transformed
        }
      } catch (error) {
        req.payload.logger.error({
          err: error,
          msg: `[plugin-import-export] Field-level before${operationLabel[operation]} hook for "${fieldPath}" threw — falling back to original value`,
        })
      }
    }

    if (!(field.name in result)) {
      continue
    }

    const value = result[field.name]

    if ((field.type === 'group' || field.type === 'tab') && isPlainObject(value)) {
      result[field.name] = traverseFields({
        type,
        data,
        fieldHooks,
        fields: field.flattenedFields,
        format,
        operation,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData: value,
      })
    } else if (field.type === 'array' && Array.isArray(value)) {
      result[field.name] = value.map((item, index) => {
        if (!isPlainObject(item)) {
          return item
        }
        return traverseFields({
          type,
          data,
          fieldHooks,
          fields: field.flattenedFields,
          format,
          operation,
          path: `${fieldPath}_${index}`,
          req,
          schemaPath: fieldSchemaPath,
          siblingData: item,
        })
      })
    } else if (field.type === 'blocks' && Array.isArray(value)) {
      result[field.name] = value.map((item, index) => {
        if (!isPlainObject(item)) {
          return item
        }
        const blockType = typeof item.blockType === 'string' ? item.blockType : undefined
        const block = blockType ? field.blocks.find((b) => b.slug === blockType) : undefined
        return traverseFields({
          type,
          data,
          fieldHooks,
          fields: block?.flattenedFields ?? [],
          format,
          operation,
          path: blockType ? `${fieldPath}_${index}_${blockType}` : `${fieldPath}_${index}`,
          req,
          schemaPath: blockType ? `${fieldSchemaPath}_${blockType}` : fieldSchemaPath,
          siblingData: item,
        })
      })
    }
  }

  return result
}

/**
 * Walks a nested document and applies each field's `beforeExport` or
 * `beforeImport` hook.
 *
 * Field-level hook errors are logged and the field falls back to its
 * original value so a single bad doc does not abort the batch.
 */
export const applyFieldHooks = (args: Args): Record<string, unknown> => {
  const { data, fieldHooks } = args
  if (!data || typeof data !== 'object' || Object.keys(fieldHooks).length === 0) {
    return data
  }

  return traverseFields({
    ...args,
    path: undefined,
    schemaPath: undefined,
    siblingData: data,
  })
}
