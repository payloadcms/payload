import type { Where } from '../types/index.js'

import { hasWhereAccessResult } from '../auth/index.js'

export const combineQueries = (where: Where, access: Where | boolean): Where => {
  if (!where && !access) {
    return {}
  }

  const result: Where = {
    and: [],
  }

  if (where) {
    result.and.push(where)
  }
  if (hasWhereAccessResult(access)) {
    result.and.push(access)
  }

  return result
}
