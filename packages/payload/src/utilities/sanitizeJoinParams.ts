import type { JoinQuery } from '../types/index.js'

import { isNumber } from './isNumber.js'

export type JoinParams =
  | 'false'
  | {
      [schemaPath: string]:
        | 'false'
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
  // `?joins=false` disables every join field. Over REST the query string makes that the
  // string 'false' rather than a boolean, and neither form survives the loop below:
  // `Object.keys('false')` is ['0','1','2','3','4'], so the string was walked character
  // by character into a join query keyed by index that matched no field and disabled
  // nothing, while `Object.keys(false)` is [] and produced an empty query with the same
  // effect. Both are the whole-query form, which `JoinQuery` expresses as `false`.
  if (_joins === false || _joins === 'false') {
    return false
  }

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
