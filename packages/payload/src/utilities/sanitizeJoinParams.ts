import type { JoinQuery } from '../types/index.js'

import { isNumber } from './isNumber.js'

/**
 * Convert request JoinQuery object from strings to numbers
 * @param joins
 */
export const sanitizeJoinParams = (
  joins:
    | {
        [schemaPath: string]:
          | {
              limit?: unknown
              sort?: string
              where?: unknown
            }
          | false
      }
    | false = {},
): JoinQuery => {
  const joinQuery = {}

  Object.keys(joins).forEach((schemaPath) => {
    if (joins[schemaPath] === 'false' || joins[schemaPath] === false) {
      joinQuery[schemaPath] = false
    } else {
      joinQuery[schemaPath] = {
        limit: isNumber(joins[schemaPath]?.limit) ? Number(joins[schemaPath].limit) : undefined,
        sort: joins[schemaPath]?.sort ? joins[schemaPath].sort : undefined,
        where: joins[schemaPath]?.where ? joins[schemaPath].where : undefined,
      }
    }
  })

  return joinQuery
}
