import type { PayloadRequest, Where, WhereField } from '../types/index.js'

import { isBranchProjectionActive } from './branchSelect.js'
import { branchDocIDField, branchParentField } from './types.js'

/**
 * Rewrites constraints on an identity key so they resolve against canonical
 * document identity rather than raw primary keys.
 *
 * A branch row's primary key is not the document's canonical ID — that lives in a
 * companion column, which main rows leave null to mean "self". So a constraint on
 * the identity key has to match either.
 */
const rewriteIdentity = ({
  canonicalField,
  identityKey,
  matchRawIdentity,
  where,
}: {
  canonicalField: string
  identityKey: string
  /**
   * Also match the identity key directly, without requiring the canonical column
   * to be null. Needed where callers address a row by its real primary key as well
   * as by canonical ID; not wanted for collection reads, where the visibility
   * predicate is what chooses between the branch's row and main's.
   */
  matchRawIdentity?: boolean
  where: undefined | Where
}): undefined | Where => {
  if (!where || typeof where !== 'object') {
    return where
  }

  const result: Where = {}

  for (const [key, value] of Object.entries(where)) {
    if ((key === 'and' || key === 'or') && Array.isArray(value)) {
      result[key] = value.map((clause) =>
        rewriteIdentity({ canonicalField, identityKey, matchRawIdentity, where: clause }),
      ) as Where[]
      continue
    }

    if (key === identityKey) {
      const constraint = value as WhereField

      result.or = [
        ...((result.or as Where[]) ?? []),
        { [canonicalField]: constraint },
        matchRawIdentity
          ? { [identityKey]: constraint }
          : { and: [{ [canonicalField]: { exists: false } }, { [identityKey]: constraint }] },
      ]

      continue
    }

    result[key] = value as WhereField
  }

  return result
}

/**
 * Rewrites `id` constraints on a collection read.
 *
 * Runs only in branch context; on main the query is untouched.
 */
export const rewriteBranchIDs = (where: undefined | Where): undefined | Where =>
  rewriteIdentity({ canonicalField: branchDocIDField, identityKey: 'id', where })

/**
 * Rewrites `parent` constraints on a version read.
 *
 * A branch version hangs off the shadow row, so its `parent` is that row's primary
 * key while the document it belongs to is in `_branchParent`. Asking for the
 * history of a document has to match both that and main's own versions, whose
 * `parent` is already the canonical ID.
 */
export const rewriteBranchVersionParents = (where: undefined | Where): undefined | Where =>
  rewriteIdentity({
    canonicalField: branchParentField,
    identityKey: 'parent',
    // Internal reads resolve the branch's shadow row first and then ask for its
    // versions by that row's primary key, so `parent` has to match raw as well.
    matchRawIdentity: true,
    where,
  })

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
  if (!docs?.length || !isBranchProjectionActive({ branch, collectionSlug, req })) {
    return
  }

  projectBranchIDs(docs)
}
