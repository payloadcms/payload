import type { JSONSchema4 } from 'json-schema'

/**
 * Removes internal Payload properties (id, createdAt, updatedAt) from a
 * JSON Schema so they don't appear in the generated Zod validation schema.
 * Also strips `id` from the `required` array when present.
 *
 * Additionally normalizes nullable type arrays (e.g. `['array', 'null']` →
 * `'array'`) throughout the schema tree. Without this, `json-schema-to-zod`
 * emits a Zod union which the MCP SDK serialises back as `anyOf`, stripping
 * the concrete `type` from the output and breaking schema introspection.
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

  if (schema.properties && typeof schema.properties === 'object') {
    for (const key of Object.keys(schema.properties)) {
      const prop = schema.properties[key] as JSONSchema4
      if (!prop || typeof prop !== 'object') {
        continue
      }
      normalizeNullableType(prop)
      if (prop.properties) {
        sanitizeJsonSchema(prop)
      }
      if (prop.items && typeof prop.items === 'object' && !Array.isArray(prop.items)) {
        sanitizeJsonSchema(prop.items)
      }
    }
  }

  return schema
}

/**
 * Strips `'null'` from a `type` array only when the remaining type is a
 * complex structural type (`array` or `object`).
 *
 * Simple scalar types (`string`, `number`, `boolean`) are intentionally
 * preserved as `['string', 'null']` so that the MCP SDK serialises them as a
 * compact inline `type` array. Complex types however cause `zodToJsonSchema`
 * to emit `anyOf: [{ type: 'array', items: ... }, { type: 'null' }]`, which
 * has no top-level `type` property and breaks schema introspection by clients.
 */
function normalizeNullableType(schema: JSONSchema4): void {
  if (!Array.isArray(schema.type)) {
    return
  }
  const nonNullTypes = schema.type.filter((t) => t !== 'null')
  if (nonNullTypes.length === 1 && (nonNullTypes[0] === 'array' || nonNullTypes[0] === 'object')) {
    schema.type = nonNullTypes[0]
  }
}
