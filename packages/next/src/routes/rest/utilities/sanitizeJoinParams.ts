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
          page?: unknown
          pagination?: unknown
          sort?: string
        }
      }
    | false = {},
): JoinQuery => {
  const joinQuery = {}

  Object.keys(joins).forEach((schemaPath) => {
    joinQuery[schemaPath] = {
      limit: isNumber(joins[schemaPath]?.limit) ? Number(joins[schemaPath].limit) : undefined,
      page: isNumber(joins[schemaPath]?.page) ? Number(joins[schemaPath].page) : undefined,
      pagination:
        joins[schemaPath]?.pagination &&
        (joins[schemaPath].pagination === 'true' || joins[schemaPath].pagination)
          ? true
          : undefined,
      sort: joins[schemaPath]?.sort ? joins[schemaPath].sort : undefined,
    }
  })

  return joinQuery
}
