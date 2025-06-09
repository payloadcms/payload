import type { JoinQuery } from '../types/index.js'

import { isNumber } from './isNumber.js'

export type JoinParams =
  | {
      [schemaPath: string]:
        | {
            limit?: unknown
            sort?: string
            where?: unknown
          }
        | false
    }
  | false

/**
 * Convert request JoinQuery object from strings to numbers
 * @param joins
 */
export const sanitizeJoinParams = (_joins: JoinParams = {}): JoinQuery => {
  const joinQuery: Record<string, any> = {}
  const joins = _joins as Record<string, any>

  Object.keys(joins).forEach((schemaPath) => {
    if (joins[schemaPath] === 'false' || joins[schemaPath] === false) {
      joinQuery[schemaPath] = false
    } else {
      joinQuery[schemaPath] = {
        count: joins[schemaPath].count === 'true',
        limit: isNumber(joins[schemaPath]?.limit) ? Number(joins[schemaPath].limit) : undefined,
        page: isNumber(joins[schemaPath]?.page) ? Number(joins[schemaPath].page) : undefined,
        sort: joins[schemaPath]?.sort ? joins[schemaPath].sort : undefined,
        where: joins[schemaPath]?.where ? joins[schemaPath].where : undefined,
      }
    }
  })

  return joinQuery
}
