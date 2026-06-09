import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server'

import { z } from 'zod'

import type { JsonSchemaType } from '../../types.js'

/**
 * Builds a create/update tool's `input`: a `data` field (the document's fields) plus controls like
 * `depth` and `draft`. Using just `z.fromJSONSchema(ourJSONSchema)` has a few problems which are mitigated
 * in this function. z.fromJSONSchema is both bigger and lossier (≈40% larger on the lexical schema).
 * Each example below is `what we publish` => `what a plain zod round-trip would publish instead`.
 *
 * @example
 * Bigger - zod inlines shared defs instead of keeping our `$ref`s (and adds junk integer bounds), so a
 * reused def is duplicated at every use:
 * `{ $ref: '#/$defs/author' }` => `{ type: 'object', properties: { id, name }, additionalProperties: false }`
 *
 * @example
 * Lossier - zod drops the `description` on `enum`/`const` fields:
 * `{ enum: ['draft', 'published'], description: 'Publish state' }` → `{ enum: ['draft', 'published'] }`
 */
export const buildToolInput = <TControls extends z.ZodRawShape>({
  controls,
  dataDescription,
  dataSchema,
}: {
  /** Tool options alongside `data` (depth, draft, where, …) as plain zod - inferred into `input`. */
  controls: TControls
  dataDescription: string
  dataSchema: JsonSchemaType
}) => {
  // `sanitizeEntitySchema` already emits draft 2020-12 with `$defs`, which is what zod's `fromJSONSchema`
  // and MCP clients both expect. Drop only the root `$schema` keyword, redundant once it's a sub-schema.
  const { $schema: _schema, ...entitySchema } = dataSchema as Record<string, unknown>

  const schema = z.object({
    data: z.fromJSONSchema(entitySchema as unknown as z.core.JSONSchema.JSONSchema),
    ...controls,
  })
  const standard = (schema as unknown as StandardSchemaWithJSON)['~standard']

  return {
    '~standard': {
      ...standard,
      jsonSchema: {
        ...standard.jsonSchema,
        input: (options) => {
          // Start from zod's JSON Schema for the whole input, then replace its lossy `data` schema with
          // the sanitized entity schema. The entity's `$defs` move to the root so the `$ref`s resolve.
          const generated = standard.jsonSchema.input(options)
          const { $defs, ...entityBody } = entitySchema
          ;(generated.properties as Record<string, unknown>).data = {
            ...entityBody,
            description: dataDescription,
          }
          if ($defs) {
            generated.$defs = $defs as object
          } else {
            delete generated.$defs
          }
          return generated
        },
      },
    },
  } as StandardSchemaWithJSON<
    { data: Record<string, unknown> } & Omit<z.output<typeof schema>, 'data'>
  >
}
