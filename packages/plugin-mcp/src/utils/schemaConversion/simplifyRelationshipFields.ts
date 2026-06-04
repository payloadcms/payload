import type { JsonSchemaType } from '../../types.js'

/**
 * Recursively simplifies relationship fields for MCP create/update input. We only need to accept
 * IDs (string/number), not populated objects, so `$ref` options pointing at full entity definitions
 * are dropped from `oneOf` unions. A lone remaining option is unwrapped; multiple become `anyOf`.
 *
 * NOTE: operates on a clone per level so the original schema (reused for tool listing) isn't mutated.
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
        // A single-target relationship collapses to a bare ID; note the target collection(s) in a description.
        const refSlugs = processed.oneOf
          .filter((option) => option && typeof option === 'object' && '$ref' in option)
          .map((option) => String((option as { $ref: string }).$ref).replace('#/$defs/', ''))
        delete processed.oneOf
        if (typeof single === 'object') {
          Object.assign(processed, single)
        }
        if (refSlugs.length > 0 && !processed.description) {
          processed.description = `The ID of the related "${refSlugs.join('" or "')}" document.`
        }
      } else if (nonRefOptions.length > 1) {
        delete processed.oneOf
        processed.anyOf = nonRefOptions
      }
    } else {
      processed.oneOf = processed.oneOf.map(recurse)
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

  // Also walk `$defs`: lexical node unions and blocks live there, and their relationship
  // fields point at collections that aren't bundled. Simplifying them drops those refs to IDs.
  if (processed.$defs && typeof processed.$defs === 'object') {
    processed.$defs = Object.fromEntries(
      Object.entries(processed.$defs).map(([key, value]) => [
        key,
        typeof value === 'object' ? simplifyRelationshipFields(value) : value,
      ]),
    )
  }

  return processed
}
