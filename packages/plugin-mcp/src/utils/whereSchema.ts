import type { Where } from 'payload'

import { validOperators } from 'payload/shared'
import { z } from 'zod'

const whereFieldSchema = z
  .partialRecord(z.enum(validOperators), z.unknown())
  .describe('Field query operators')

/**
 * - Validates the `where` input of collection tools against Payload's `Where` shape
 * - Field keys map to operator objects restricted to `validOperators`
 * - `and` / `or` nest recursively
 */
export const whereSchema: z.ZodType<Where> = z
  .lazy(() =>
    z
      .object({
        and: z.array(whereSchema).optional(),
        or: z.array(whereSchema).optional(),
      })
      .catchall(whereFieldSchema),
  )
  .describe('Where clause using field names with Payload query operators, plus and/or groups')
