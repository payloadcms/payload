import type { PayloadRequest, Where, WhereField } from '../types/index.js'

import { resolveBranch } from './resolveBranch.js'
import { branchDocIDField, MAIN_BRANCH } from './types.js'

/**
 * Rewrites `id` constraints so they resolve against canonical document
 * identity rather than raw primary keys.
 *
 * A shadow row's primary key is not the document's canonical ID — that lives in
 * `_branchDocID`. Main rows leave `_branchDocID` null, meaning "self". So an
 * `id` constraint has to match either.
 *
 * Runs only in branch context; on main the query is untouched.
 */
export const rewriteBranchIDs = (where: undefined | Where): undefined | Where => {
  if (!where || typeof where !== 'object') {
    return where
  }

  const result: Where = {}

  for (const [key, value] of Object.entries(where)) {
    if ((key === 'and' || key === 'or') && Array.isArray(value)) {
      result[key] = value.map((clause) => rewriteBranchIDs(clause)) as Where[]
      continue
    }

    if (key === 'id') {
      const constraint = value as WhereField

      result.or = [
        ...((result.or as Where[]) ?? []),
        { [branchDocIDField]: constraint },
        { and: [{ [branchDocIDField]: { exists: false } }, { id: constraint }] },
      ]

      continue
    }

    result[key] = value as WhereField
  }

  return result
}

/**
 * Restores canonical IDs on documents read from a branch.
 *
 * Shadow rows surface their own primary key, which no API consumer knows about.
 * `_branchDocID` holds the canonical ID for forked rows and is null for
 * branch-created rows, whose own ID is already canonical.
 */
export const projectBranchIDs = <T extends Record<string, any>>(docs: T[]): T[] => {
  for (const doc of docs) {
    const canonical = doc?.[branchDocIDField]

    if (canonical !== undefined && canonical !== null) {
      ;(doc as Record<string, unknown>).id =
        typeof canonical === 'object' ? canonical.value : canonical
    }
  }

  return docs
}

/**
 * Guarded entry point for adapters.
 *
 * Skipped entirely when the caller opted out with `branch: false`. Internal
 * reads made by the fork and write-target resolution address rows by their real
 * primary key and would be corrupted by having canonical IDs projected over it.
 */
export const applyBranchIDProjection = ({
  branch,
  collectionSlug,
  docs,
  req,
}: {
  branch?: false | string
  collectionSlug: string
  docs: Record<string, unknown>[]
  req?: Partial<PayloadRequest>
}): void => {
  if (branch === false || !req?.payload || !docs?.length) {
    return
  }

  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return
  }

  if ((branch ?? resolveBranch(req as PayloadRequest)) === MAIN_BRANCH) {
    return
  }

  projectBranchIDs(docs)
}
