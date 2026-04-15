import type { FlattenedField } from 'payload'

import type { FieldImportHook } from '../types.js'

type Args = {
  doc: Record<string, unknown>
  fieldHooks: Record<string, FieldImportHook>
  fields: FlattenedField[]
  format: 'csv' | 'json' | ({} & string)
}

/**
 * Applies field-level import hooks to a nested JSON document.
 * Traverses the document structure following the field schema and calls
 * each field's import hook with the field's value, allowing transformation.
 *
 * This enables field-level hooks to work with JSON imports, not just CSV.
 * Returns a new document with transformed values.
 */
export const applyFieldImportHooks = ({
  doc,
  fieldHooks,
  fields,
  format,
}: Args): Record<string, unknown> => {
  if (!doc || typeof doc !== 'object' || Object.keys(fieldHooks).length === 0) {
    return doc
  }

  return applyHooksToLevel({
    doc,
    fieldHooks,
    fields,
    format,
    prefix: '',
  })
}

type ApplyArgs = {
  doc: Record<string, unknown>
  fieldHooks: Record<string, FieldImportHook>
  fields: FlattenedField[]
  format: 'csv' | 'json' | ({} & string)
  prefix: string
}

const applyHooksToLevel = ({
  doc,
  fieldHooks,
  fields,
  format,
  prefix,
}: ApplyArgs): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...doc }

  for (const field of fields) {
    if (!('name' in field)) {
      continue
    }

    const fieldKey = prefix ? `${prefix}_${field.name}` : field.name
    const hook = fieldHooks[fieldKey]

    if (typeof hook === 'function' && field.name in result) {
      const value = result[field.name]

      try {
        const transformed = hook({
          columnName: fieldKey,
          data: doc,
          format,
          value,
        })

        if (typeof transformed !== 'undefined') {
          result[field.name] = transformed
        }
      } catch (error) {
        throw new Error(`Error in field import hook for "${fieldKey}": ${(error as Error).message}`)
      }
    } else if (!hook && field.name in result) {
      // Recurse into nested objects for fields without hooks
      const value = result[field.name]

      // group and named tab both add a nesting level in the document
      if (
        (field.type === 'group' || field.type === 'tab') &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[field.name] = applyHooksToLevel({
          doc: value as Record<string, unknown>,
          fieldHooks,
          fields: (field as any).flattenedFields ?? (field as any).fields ?? [],
          format,
          prefix: fieldKey,
        })
      } else if (field.type === 'array' && Array.isArray(value)) {
        result[field.name] = value.map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            return applyHooksToLevel({
              doc: item as Record<string, unknown>,
              fieldHooks,
              fields: (field as any).flattenedFields ?? (field as any).fields ?? [],
              format,
              prefix: `${fieldKey}_${index}`,
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
            const blockPrefix = blockType
              ? `${fieldKey}_${index}_${blockType}`
              : `${fieldKey}_${index}`

            return applyHooksToLevel({
              doc: item as Record<string, unknown>,
              fieldHooks,
              fields: blockFields,
              format,
              prefix: blockPrefix,
            })
          }
          return item
        })
      }
    }
  }

  return result
}
