import type { PayloadRequest } from '../types/index.js'

import { Forbidden } from '../errors/Forbidden.js'
import { resolveBranch } from './resolveBranch.js'
import { branchesCollectionSlug, MAIN_BRANCH } from './types.js'

const checkedKey = '_branchReadableChecked'

/**
 * Refuses a request that names a branch the caller cannot see.
 *
 * This is the one thing a document's own access control cannot express. Collection
 * rules answer "who may read this content"; they are branch-agnostic on purpose, and
 * `req.branch` being in scope means a project can already vary them per branch. What
 * they cannot answer is whether this reader should be looking at a *proposal* rather
 * than production — and that answer is the same for every collection in the project,
 * which is why it belongs here rather than repeated in each of them.
 *
 * Concretely, the canonical public-site rule `read: () => ({ _status: { equals:
 * 'published' } })` is *true* of a branch's copy of a published document, because that
 * copy really is published — on the branch. Without this gate, adding `?branch=x` to a
 * public URL serves unreleased content to anonymous callers.
 *
 * Three properties keep this from becoming a second permission system:
 *
 * - **It only ever narrows.** Branch access is ANDed with document access, so reading a
 *   branch never grants a document the caller could not read on `main`.
 * - **The safe default is free.** `payload-branches` read access falls back to
 *   `defaultAccess` (an authenticated admin user), so anonymous requests can only ever
 *   reach `main` with no configuration at all.
 * - **One query per branched request, none for `main`.** An unbranched request still
 *   touches nothing, which is §15's central constraint.
 *
 * Enforced at the HTTP boundary rather than at the database layer, because the request
 * the operations hand to the adapter is narrowed to `branch`, `context`, `payload` and
 * `transactionID` — it has no `user`, so an access check there has nobody to check.
 */
export const assertBranchReadable = async ({ req }: { req: PayloadRequest }): Promise<void> => {
  const branching = req.payload?.config?.branching

  if (!branching?.enabled) {
    return
  }

  const branch = resolveBranch(req)

  if (branch === MAIN_BRANCH) {
    return
  }

  const context = req.context as Record<string, unknown> | undefined

  if (context?.[checkedKey]) {
    return
  }

  // Read through the ordinary operation so `readBranch` access gets its usual
  // treatment — including a `Where` return, which is how "editors see only their own
  // branches" is expressed.
  const { docs } = await req.payload.find({
    collection: branchesCollectionSlug,
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req,
    where: { slug: { equals: branch } },
  })

  if (!docs.length) {
    // Unreadable and non-existent are deliberately the same answer: distinguishing
    // them would tell an anonymous caller which branch names exist.
    throw new Forbidden(req.t)
  }

  if (context) {
    context[checkedKey] = true
  }
}
