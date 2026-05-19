import type { JsonSchemaType } from '../../types.js'

import { sanitizeJsonSchema } from './sanitizeJsonSchema.js'
import { simplifyRelationshipFields } from './simplifyRelationshipFields.js'
import { transformPointFieldsForMCP } from './transformPointFields.js'

/**
 * Fields Payload manages automatically — clients should never be required to provide
 * them. Stripped from `required` and `properties` so they don't appear in tool
 * inputs.
 */
const PAYLOAD_MANAGED_FIELDS = new Set(['_status', 'createdAt', 'id', 'updatedAt'])

/**
 * Sanitizes Payload's auto-generated collection JSON Schema so it can be safely
 * fed into the MCP server's `fromJsonSchema()` adapter (no zod intermediate step).
 */
export const prepareCollectionSchema = (schema: JsonSchemaType): JsonSchemaType => {
  // Clone to avoid mutating the original schema (used elsewhere for tool listing)
  const schemaClone = JSON.parse(JSON.stringify(schema)) as JsonSchemaType

  const sanitized = sanitizeJsonSchema(schemaClone)
  const pointTransformed = transformPointFieldsForMCP(sanitized)
  const simplified = simplifyRelationshipFields(pointTransformed)

  if (simplified.properties) {
    for (const field of PAYLOAD_MANAGED_FIELDS) {
      delete simplified.properties[field]
    }
  }
  if (Array.isArray(simplified.required)) {
    simplified.required = simplified.required.filter((name) => !PAYLOAD_MANAGED_FIELDS.has(name))
    if (simplified.required.length === 0) {
      delete simplified.required
    }
  }

  return simplified
}
