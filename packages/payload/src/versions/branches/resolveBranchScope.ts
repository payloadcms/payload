import type {
  BranchContentScope,
  BranchHead,
  BranchHeadID,
  BranchHeadToken,
  ResolvedBranchScope,
} from './types.js'

import { areBranchScopesEqual } from './compareBranchHeads.js'

/**
 * Resolves one entity's scope. Only an absent working head inherits main; a withdrawal
 * explicitly hides inherited content. Published scopes never inherit working content.
 */
export const resolveBranchScope = ({
  branchHead,
  branchID,
  branchIncarnation,
  publishedBranchID,
  publishedHead = null,
  publishedIncarnation,
  scope,
}: {
  branchHead: BranchHead | null
  branchID: BranchHeadID
  /** Read from the durable guard even when the selected override is absent. */
  branchIncarnation?: number
  publishedBranchID: BranchHeadID
  /** Only needed when resolving a working branch with no owned head. */
  publishedHead?: BranchHead | null
  publishedIncarnation?: number
  scope: BranchContentScope
}): ResolvedBranchScope => {
  const localToken = getHeadToken({
    branchID,
    head: branchHead,
    incarnation: branchIncarnation,
    scope,
  })

  if (branchHead || branchID === publishedBranchID) {
    return {
      branchID,
      isInherited: false,
      readSet: [localToken],
      scope,
      source: localToken,
      state: localToken.state,
    }
  }

  const publishedToken = getHeadToken({
    branchID: publishedBranchID,
    head: publishedHead,
    incarnation: publishedIncarnation,
    scope,
  })

  return {
    branchID,
    isInherited: true,
    readSet: [localToken, publishedToken],
    scope,
    source: publishedToken,
    state: publishedToken.state,
  }
}

const getHeadToken = ({
  branchID,
  head,
  incarnation,
  scope,
}: {
  branchID: BranchHeadID
  head: BranchHead | null
  incarnation?: number
  scope: BranchContentScope
}): BranchHeadToken => {
  if (
    [incarnation, head?.incarnation].some(
      (value) => value !== undefined && (!Number.isSafeInteger(value) || value < 0),
    )
  ) {
    throw new Error('Head incarnation must be a nonnegative safe integer.')
  }

  const guard = incarnation === undefined ? {} : { incarnation }

  if (!head) {
    return { branchID, generation: null, ...guard, scope, state: null }
  }

  if (head.branchID !== branchID || !areBranchScopesEqual({ left: head.scope, right: scope })) {
    throw new Error('Branch head does not match the requested branch and content scope.')
  }

  if (incarnation !== undefined && (head.incarnation ?? 0) !== incarnation) {
    throw new Error('Head does not match its durable incarnation guard.')
  }

  return {
    branchID,
    generation: head.generation,
    ...(head.incarnation === undefined ? guard : { incarnation: head.incarnation }),
    scope,
    state: head.state,
  }
}
