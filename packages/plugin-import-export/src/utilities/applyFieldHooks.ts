import type { FlattenedField } from 'payload'

import type {
  ExportFieldHookEntry,
  FieldBeforeExportHook,
  FieldBeforeImportHook,
  ImportFieldHookEntry,
} from '../types.js'

export type FieldHook = FieldBeforeExportHook | FieldBeforeImportHook

export type FieldHookEntry = ExportFieldHookEntry | ImportFieldHookEntry

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const joinPath = (parent: string | undefined, segment: string): string =>
  parent ? `${parent}_${segment}` : segment

export type Args = {
  data: Record<string, unknown>
  fieldHooks: Record<string, FieldHookEntry>
  fields: FlattenedField[]
  format: 'csv' | 'json' | ({} & string)
  operation: 'export' | 'import'
  type: 'beforeExport' | 'beforeImport'
}

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
      const value = result[field.name]

      try {
        const transformed = hook({
          columnName: fieldPath,
          data,
          format,
          siblingData: result,
          siblingDoc: siblingData,
          value,
        })

        if (typeof transformed !== 'undefined') {
          result[field.name] = transformed
        }
      } catch (error) {
        throw new Error(
          `Error in field ${operation} hook for "${fieldPath}": ${(error as Error).message}`,
        )
      }
      continue
    }

    if (hook || !(field.name in result)) {
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
 * `beforeImport` hook. Legacy `toCSV` / `fromCSV` hooks are handled by the
 * flat CSV pipelines and skipped here.
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
