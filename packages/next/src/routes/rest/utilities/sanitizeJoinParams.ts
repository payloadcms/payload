import type { JoinQuery } from 'payload'

import { isNumber } from 'payload/shared'

/**
 * Convert request JoinQuery object from strings to numbers
 * @param joins
 */
export const sanitizeJoinParams = (
  joins:
    | {
        [schemaPath: string]: {
          limit?: unknown
          sort?: string
          where?: unknown
        }
      }
    | false = {},
): JoinQuery => {
  const joinQuery = {}

  Object.keys(joins).forEach((schemaPath) => {
    joinQuery[schemaPath] = {
      limit: isNumber(joins[schemaPath]?.limit) ? Number(joins[schemaPath].limit) : undefined,
      sort: joins[schemaPath]?.sort ? joins[schemaPath].sort : undefined,
      where: joins[schemaPath]?.where ? joins[schemaPath].where : undefined,
    }
  })

  return joinQuery
}
