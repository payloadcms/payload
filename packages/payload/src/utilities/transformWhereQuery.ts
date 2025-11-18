import type { Where } from '../types/index.js'

/**
 * Transforms a basic "where" query into a format in which the "where builder" can understand.
 * Even though basic queries are valid, we need to hoist them into the "and" / "or" format.
 * Use this function alongside `validateWhereQuery` to check that for valid queries before transforming.
 * @example
 * Inaccurate: [text][equals]=example%20post
 * Accurate: [or][0][and][0][text][equals]=example%20post
 */
export const transformWhereQuery = (whereQuery: Where): Where => {
  if (!whereQuery) {
    return {}
  }

  // Check if 'whereQuery' has 'or' field but no 'and'. This is the case for "correct" queries
  if (whereQuery.or && !whereQuery.and) {
    return {
      or: whereQuery.or.map((query) => {
        // ...but if the or query does not have an and, we need to add it
        if (!query.and) {
          return {
            and: [query],
          }
        }
        return query
      }),
    }
  }

  // Check if 'whereQuery' has 'and' field but no 'or'.
  if (whereQuery.and && !whereQuery.or) {
    return {
      or: [
        {
          and: whereQuery.and,
        },
      ],
    }
  }

  // Check if 'whereQuery' has neither 'or' nor 'and'.
  if (!whereQuery.or && !whereQuery.and) {
    return {
      or: [
        {
          and: [whereQuery], // top-level siblings are considered 'and'
        },
      ],
    }
  }

  // If 'whereQuery' has 'or' and 'and', just return it as it is.
  return whereQuery
}
