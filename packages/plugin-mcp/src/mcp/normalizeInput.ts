import { z } from 'zod'

import type { JsonSchemaObject, MCPInputSchema } from '../types.js'

/**
 * Convert an `input` value from a tool definition into a JSON Schema object.
 *
 * Accepts:
 * - a JSON Schema object (passed through unchanged)
 * - a zod schema (converted via `z.toJSONSchema`)
 * - any other Standard Schema (currently passed through — only zod is converted
 *   internally; users of other validators should call their own toJsonSchema())
 */
export const normalizeInput = (input: MCPInputSchema | undefined): JsonSchemaObject => {
  if (!input) {
    return { type: 'object', properties: {} }
  }

  // zod 4 schemas carry a `_zod` brand and the `~standard` Standard Schema property.
  if ('_zod' in input || (input as { _def?: unknown })._def) {
    // `io: 'input'` excludes fields with `.default(...)` from the schema's
    // `required` list — clients don't have to supply them; zod fills in the
    // default at parse time.
    return z.toJSONSchema(input as unknown as Parameters<typeof z.toJSONSchema>[0], {
      io: 'input',
    }) as JsonSchemaObject
  }

  return input as JsonSchemaObject
}
