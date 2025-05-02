import type { Where } from '../types/index.js'

import { hasWhereAccessResult } from '../auth/index.js'

/**
 * Combines two queries into a single query, using an AND operator
 */
export const combineQueries = (where: Where, access: boolean | Where): Where => {
  if (!where && !access) {
    return {}
  }

  const and: Where[] = where ? [where] : []

  if (hasWhereAccessResult(access)) {
    and.push(access)
  }

  return {
    and,
  }
}
