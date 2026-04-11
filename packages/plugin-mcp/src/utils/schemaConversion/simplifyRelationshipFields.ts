import type { JSONSchema4 } from 'json-schema'

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
export function simplifyRelationshipFields(schema: JSONSchema4): JSONSchema4 {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const processed = { ...schema }

  if (Array.isArray(processed.oneOf)) {
    const hasRef = processed.oneOf.some(
      (option) => option && typeof option === 'object' && '$ref' in option,
    )

    if (hasRef) {
      const nonRefOptions = processed.oneOf
        .filter((option) => !(option && typeof option === 'object' && '$ref' in option))
        .map((option) => simplifyRelationshipFields(option))

      if (nonRefOptions.length === 1) {
        const single = nonRefOptions[0]!
        delete processed.oneOf
        Object.assign(processed, single)
      } else if (nonRefOptions.length > 1) {
        delete processed.oneOf
        processed.anyOf = nonRefOptions
      }
    } else {
      processed.anyOf = processed.oneOf.map((option) => simplifyRelationshipFields(option))
      delete processed.oneOf
    }
  }

  if (processed.properties && typeof processed.properties === 'object') {
    processed.properties = Object.fromEntries(
      Object.entries(processed.properties).map(([key, value]) => [
        key,
        simplifyRelationshipFields(value),
      ]),
    )
  }

  if (processed.items && typeof processed.items === 'object' && !Array.isArray(processed.items)) {
    processed.items = simplifyRelationshipFields(processed.items)
  }

  return processed
}
