import type { JSONSchema4 } from 'json-schema'

/**
 * Removes internal Payload properties (id, createdAt, updatedAt) from a
 * JSON Schema so they don't appear in the generated Zod validation schema.
 * Also strips `id` from the `required` array when present.
 */
export function sanitizeJsonSchema(schema: JSONSchema4): JSONSchema4 {
  delete schema?.properties?.id
  delete schema?.properties?.createdAt
  delete schema?.properties?.updatedAt

  if (Array.isArray(schema.required)) {
    schema.required = schema.required.filter((field) => field !== 'id')
    if (schema.required.length === 0) {
      delete schema.required
    }
  }

  return schema
}
