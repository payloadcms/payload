import type { Where } from '../../../types/index.js'
import type { buildJoinScopeWhere } from './buildJoinScopeWhere.js'

/**
 * Wraps a base `where` condition with a join-scope filter when present.
 */
export function applyJoinScopeWhere(args: {
  baseWhere: Where
  joinScopeWhere: ReturnType<typeof buildJoinScopeWhere>
}): Where {
  const { baseWhere, joinScopeWhere } = args

  if (!joinScopeWhere) {
    return baseWhere
  }

  return {
    and: [baseWhere, joinScopeWhere],
  }
}
