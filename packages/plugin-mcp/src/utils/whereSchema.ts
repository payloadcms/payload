import type { HasManyRelationshipOperator, Where, WhereField } from 'payload'

import { hasManyRelationshipOperatorSet, validOperators } from 'payload/shared'
import { z } from 'zod'

const valueOperatorSchemas = Object.fromEntries(
  validOperators
    .filter(
      (operator) => !hasManyRelationshipOperatorSet.has(operator as HasManyRelationshipOperator),
    )
    .map((operator) => [operator, z.unknown().optional()]),
)

/**
 * - Validates the `where` input of collection tools against Payload's `Where` shape
 * - Field keys map to operator objects restricted to `validOperators`
 * - `and` / `or` nest recursively
 */
export const whereSchema: z.ZodType<Where> = z.lazy(() => {
  // Most operators accept a value. Relationship operators contain another `where` query, so
  // they must point back to this recursive schema instead of accepting an unvalidated value.
  const whereFieldSchema = z
    .strictObject({
      ...valueOperatorSchemas,
      every: whereSchema.optional(),
      none: whereSchema.optional(),
      some: whereSchema.optional(),
    })
    .describe('Field query operators') as z.ZodType<WhereField>

  return z
    .object({
      and: z.array(whereSchema).optional(),
      or: z.array(whereSchema).optional(),
    })
    .catchall(whereFieldSchema)
    .describe('Where clause using field names with Payload query operators, plus and/or groups')
})
