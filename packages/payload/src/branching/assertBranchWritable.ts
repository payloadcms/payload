import type { PayloadRequest } from '../types/index.js'

import { Forbidden } from '../errors/index.js'
import { loadBranchRow } from './resolveBranch.js'
import { MAIN_BRANCH } from './types.js'

const stateKey = '_branchWritable'

/**
 * Refuses a write when the branch it targets has been closed.
 *
 * Closing is the terminal state a merge can put a branch into, and it has to be
 * enforced rather than merely displayed: the switcher already hides closed
 * branches, but a `branch=<slug>` query param reaches the write path regardless,
 * and so does a client that was already on the branch when it closed. Without this
 * a closed branch keeps accepting edits nobody can navigate to.
 *
 * Memoized per request, keyed by branch, so a write touching many documents costs
 * one lookup rather than one per document.
 */
export const assertBranchWritable = async ({
  branch,
  req,
}: {
  branch: string
  req: PayloadRequest
}): Promise<void> => {
  if (branch === MAIN_BRANCH) {
    return
  }

  const context = req.context as Record<string, unknown> | undefined
  const cache = (context?.[stateKey] as Map<string, boolean> | undefined) ?? new Map()

  if (context && !context[stateKey]) {
    context[stateKey] = cache
  }

  if (cache.has(branch)) {
    if (!cache.get(branch)) {
      throw new Forbidden(req.t)
    }

    return
  }

  const row = await loadBranchRow({ branch, req })

  // A branch that does not exist is left alone: creating rows against an unknown
  // slug is a separate problem, and failing here would make this the place that
  // decides branch existence.
  const isWritable = (row as { status?: string } | null)?.status !== 'closed'

  cache.set(branch, isWritable)

  if (!isWritable) {
    throw new Forbidden(req.t)
  }
}
