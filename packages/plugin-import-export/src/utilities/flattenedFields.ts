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
