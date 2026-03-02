import type { JSONSchema4 } from 'json-schema'

/**
 * Removes virtual fields from a JSON Schema by name so they don't appear
 * in the generated MCP tool input schema.
 */
export function removeVirtualFieldsFromSchema(
  schema: JSONSchema4,
  virtualFieldNames: string[],
): JSONSchema4 {
  if (virtualFieldNames.length === 0) {
    return schema
  }

  for (const name of virtualFieldNames) {
    delete schema?.properties?.[name]
  }

  if (Array.isArray(schema.required)) {
    schema.required = schema.required.filter((field) => !virtualFieldNames.includes(field))
    if (schema.required.length === 0) {
      delete schema.required
    }
  }

  return schema
}
