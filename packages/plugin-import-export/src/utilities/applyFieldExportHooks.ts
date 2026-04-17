import type { FlattenedField } from 'payload'

import type { FieldBeforeExportHook } from '../types.js'

type Args = {
  data: Record<string, unknown>
  fieldHooks: Record<string, FieldBeforeExportHook>
  fields: FlattenedField[]
  format: 'csv' | 'json' | ({} & string)
}

/**
 * Walks a nested document alongside the field schema, applying each field's
 * export hook to its value. `columnName` in the hook args uses the runtime
 * path (with indices); the lookup uses the schema path (without indices)
 * so it matches the static keys in `getExportFieldFunctions`.
 */
export const applyFieldBeforeExportHooks = ({
  data,
  fieldHooks,
  fields,
  format,
}: Args): Record<string, unknown> => {
  if (!data || typeof data !== 'object' || Object.keys(fieldHooks).length === 0) {
    return data
  }

  return applyHooksToLevel({
    data,
    fieldHooks,
    fields,
    format,
    path: '',
    schemaPath: '',
    siblingData: data,
  })
}

type ApplyArgs = {
  /** The top-level document being exported — carried through recursion for hook args. */
  data: Record<string, unknown>
  fieldHooks: Record<string, FieldBeforeExportHook>
  fields: FlattenedField[]
  format: 'csv' | 'json' | ({} & string)
  /** The runtime path prefix at this recursion level (with array indices). */
  path: string
  /** The schema path prefix at this recursion level (without array indices). */
  schemaPath: string
  /** The source document at the current nesting level. */
  siblingData: Record<string, unknown>
}

const applyHooksToLevel = ({
  data,
  fieldHooks,
  fields,
  format,
  path,
  schemaPath,
  siblingData,
}: ApplyArgs): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...siblingData }

  for (const field of fields) {
    if (!('name' in field)) {
      continue
    }

    const fieldPath = path ? `${path}_${field.name}` : field.name
    const fieldSchemaPath = schemaPath ? `${schemaPath}_${field.name}` : field.name
    const hook = fieldHooks[fieldSchemaPath]

    if (typeof hook === 'function' && field.name in result) {
      const value = result[field.name]

      try {
        const transformed = hook({
          columnName: fieldPath,
          data,
          format,
          siblingData: result,
          value,
        })

        if (typeof transformed !== 'undefined') {
          result[field.name] = transformed
        }
      } catch (error) {
        throw new Error(
          `Error in field export hook for "${fieldPath}": ${(error as Error).message}`,
        )
      }
    } else if (!hook && field.name in result) {
      const value = result[field.name]

      if (
        (field.type === 'group' || field.type === 'tab') &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[field.name] = applyHooksToLevel({
          data,
          fieldHooks,
          fields: (field as any).flattenedFields ?? (field as any).fields ?? [],
          format,
          path: fieldPath,
          schemaPath: fieldSchemaPath,
          siblingData: value as Record<string, unknown>,
        })
      } else if (field.type === 'array' && Array.isArray(value)) {
        result[field.name] = value.map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            return applyHooksToLevel({
              data,
              fieldHooks,
              fields: (field as any).flattenedFields ?? (field as any).fields ?? [],
              format,
              path: `${fieldPath}_${index}`,
              schemaPath: fieldSchemaPath,
              siblingData: item as Record<string, unknown>,
            })
          }
          return item
        })
      } else if (field.type === 'blocks' && Array.isArray(value)) {
        result[field.name] = value.map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const blockType = (item as Record<string, unknown>).blockType as string | undefined
            const block = blockType
              ? ((field as any).blocks ?? []).find((b: any) => b.slug === blockType)
              : undefined
            const blockFields = block?.flattenedFields ?? block?.fields ?? []

            return applyHooksToLevel({
              data,
              fieldHooks,
              fields: blockFields,
              format,
              path: blockType ? `${fieldPath}_${index}_${blockType}` : `${fieldPath}_${index}`,
              schemaPath: blockType ? `${fieldSchemaPath}_${blockType}` : fieldSchemaPath,
              siblingData: item as Record<string, unknown>,
            })
          }
          return item
        })
      }
    }
  }

  return result
}
