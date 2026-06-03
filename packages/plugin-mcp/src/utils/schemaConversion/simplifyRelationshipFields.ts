import type { JsonSchemaType } from '../../types.js'

/**
 * Recursively processes JSON schema properties to simplify relationship fields
 * and convert `oneOf` constructs into MCP-friendly schemas.
 *
 * For create/update validation we only need to accept IDs (string/number),
 * not populated objects. `$ref` options pointing to full entity definitions
 * are removed entirely from `oneOf` unions. When a single option remains the
 * `oneOf` is unwrapped; otherwise it is converted to `anyOf`.
 *
 * This matters because `json-schema-to-zod` converts `oneOf` into a strict
 * `z.any().superRefine(...)` validator whose base type is `z.any()`, causing
 * `zodToJsonSchema` to emit `{}` and losing all type information in the MCP
 * tool input schema. `anyOf` instead produces a clean `z.union([...])`.
 *
 * NOTE: This function must operate on a cloned schema to avoid mutating
 * the original JSON schema used for tool listing.
 */
export function simplifyRelationshipFields(schema: JsonSchemaType): JsonSchemaType {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const processed = { ...schema }

  if (Array.isArray(processed.oneOf)) {
    const hasRef = processed.oneOf.some(
      (option) => option && typeof option === 'object' && '$ref' in option,
    )

    const recurse = (option: boolean | JsonSchemaType): boolean | JsonSchemaType =>
      typeof option === 'object' ? simplifyRelationshipFields(option) : option

    if (hasRef) {
      const nonRefOptions = processed.oneOf
        .filter((option) => !(option && typeof option === 'object' && '$ref' in option))
        .map(recurse)

      if (nonRefOptions.length === 1) {
        const single = nonRefOptions[0]!
        delete processed.oneOf
        if (typeof single === 'object') {
          Object.assign(processed, single)
        }
      } else if (nonRefOptions.length > 1) {
        delete processed.oneOf
        processed.anyOf = nonRefOptions
      }
    } else {
      processed.anyOf = processed.oneOf.map(recurse)
      delete processed.oneOf
    }
  }

  if (processed.properties && typeof processed.properties === 'object') {
    processed.properties = Object.fromEntries(
      Object.entries(processed.properties).map(([key, value]) => [
        key,
        typeof value === 'object' ? simplifyRelationshipFields(value) : value,
      ]),
    )
  }

  if (processed.items && typeof processed.items === 'object' && !Array.isArray(processed.items)) {
    processed.items = simplifyRelationshipFields(processed.items)
  }

  // Also walk `definitions`: lexical node unions and blocks live there, and their relationship
  // fields point at collections that aren't bundled. Simplifying them drops those refs to IDs.
  if (processed.definitions && typeof processed.definitions === 'object') {
    processed.definitions = Object.fromEntries(
      Object.entries(processed.definitions).map(([key, value]) => [
        key,
        typeof value === 'object' ? simplifyRelationshipFields(value) : value,
      ]),
    )
  }

  return processed
}
