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
  publishedBranchID,
  publishedHead = null,
  scope,
}: {
  branchHead: BranchHead | null
  branchID: BranchHeadID
  publishedBranchID: BranchHeadID
  /** Only needed when resolving a working branch with no owned head. */
  publishedHead?: BranchHead | null
  scope: BranchContentScope
}): ResolvedBranchScope => {
  const localToken = getHeadToken({ branchID, head: branchHead, scope })

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

  const publishedToken = getHeadToken({ branchID: publishedBranchID, head: publishedHead, scope })

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
  scope,
}: {
  branchID: BranchHeadID
  head: BranchHead | null
  scope: BranchContentScope
}): BranchHeadToken => {
  if (!head) {
    return { branchID, generation: null, scope, state: null }
  }

  if (head.branchID !== branchID || !areBranchScopesEqual({ left: head.scope, right: scope })) {
    throw new Error('Branch head does not match the requested branch and content scope.')
  }

  return { branchID, generation: head.generation, scope, state: head.state }
}
