import type { FlattenedField } from 'payload'

/**
 * Returns the `flattenedFields` of a group/tab/array field, or undefined for
 * field types that don't carry nested fields. Concentrates the cast for the
 * Payload core typing oversight (`FlattenedField` doesn't expose
 * `flattenedFields` on every variant).
 */
export const getNestedFlattenedFields = (field: FlattenedField): FlattenedField[] | undefined =>
  (field as { flattenedFields?: FlattenedField[] }).flattenedFields

/**
 * Returns the `flattenedFields` of a `BlocksField` block (always an array).
 */
export const getBlockFlattenedFields = (block: {
  flattenedFields?: FlattenedField[]
}): FlattenedField[] => block.flattenedFields ?? []

/**
 * Traverses a flattened field schema and calls `registerHandler` for each
 * named field. Handles blocks (keyed by block slug), groups, tabs, and arrays.
 * Shared by `getExportFieldFunctions` and `getImportFieldFunctions`.
 */
export const registerFieldHooks = <TEntry>(
  fields: FlattenedField[],
  parentPath: string,
  result: Record<string, TEntry>,
  registerHandler: (field: FlattenedField, fullKey: string, result: Record<string, TEntry>) => void,
): void => {
  for (const field of fields) {
    if (!('name' in field) || !field.name) {
      continue
    }

    if (field.type === 'blocks') {
      const base = parentPath ? `${parentPath}_${field.name}` : field.name
      for (const block of field.blocks ?? []) {
        registerFieldHooks(
          getBlockFlattenedFields(block),
          `${base}_${block.slug}`,
          result,
          registerHandler,
        )
      }
      continue
    }

    const fullKey = parentPath ? `${parentPath}_${field.name}` : field.name
    registerHandler(field, fullKey, result)

    if (field.type === 'group' || field.type === 'tab' || field.type === 'array') {
      registerFieldHooks(getNestedFlattenedFields(field) ?? [], fullKey, result, registerHandler)
    }
  }
}
