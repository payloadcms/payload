import type { Operator, Where } from '../types/index.js'

import { validOperatorSet } from '../types/constants.js'

/**
 * Validates that a "where" query is in a format in which the "where builder" can understand.
 * Even though basic queries are valid, we need to hoist them into the "and" / "or" format.
 * Use this function alongside `transformWhereQuery` to perform a transformation if the query is not valid.
 * @example
 * Inaccurate: [text][equals]=example%20post
 * Accurate: [or][0][and][0][text][equals]=example%20post
 */
export const validateWhereQuery = (whereQuery: Where): whereQuery is Where => {
  if (
    whereQuery?.or &&
    whereQuery?.or?.length > 0 &&
    whereQuery?.or?.[0]?.and &&
    whereQuery?.or?.[0]?.and?.length > 0
  ) {
    // At this point we know that the whereQuery has 'or' and 'and' fields,
    // now let's check the structure and content of these fields.

    const isValid = whereQuery.or.every((orQuery) => {
      if (orQuery.and && Array.isArray(orQuery.and)) {
        return orQuery.and.every((andQuery) => {
          if (typeof andQuery !== 'object') {
            return false
          }

          const andKeys = Object.keys(andQuery)

          // If there are no keys, it's not a valid WhereField.
          if (andKeys.length === 0) {
            return false
          }

          for (const key of andKeys) {
            const operator = Object.keys(andQuery[key])[0]
            // Check if the key is a valid Operator.
            if (!operator || !validOperatorSet.has(operator as Operator)) {
              return false
            }
          }
          return true
        })
      }
      return false
    })

    return isValid
  }

  return false
}
