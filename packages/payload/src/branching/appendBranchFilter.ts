import type { Where } from '../types/index.js'

import { branchDocIDField, branchField, MAIN_BRANCH } from './types.js'

type Args = {
  /** The active branch slug, or `'main'`. */
  branch: string
  /** Canonical IDs deleted on this branch, from the change manifest. */
  deletedIDs: (number | string)[]
  /** Whether branching is active for this entity. */
  enabled: boolean
  /**
   * Canonical IDs of the documents this branch has shadowed, from the change
   * manifest. Bounded by branch size rather than table size.
   */
  shadowedIDs: (number | string)[]
  where: Where
}

const and = (where: Where, ...constraints: Where[]): Where => {
  if (!constraints.length) {
    return where
  }

  if (where?.and) {
    return { ...where, and: [...where.and, ...constraints] }
  }

  return { and: [...(where && Object.keys(where).length ? [where] : []), ...constraints] }
}

/**
 * Appends the branch visibility predicate to a read query.
 *
 * On `main` this is a single indexed equality — the overwhelmingly common read
 * must not pay for the branch machinery. On a branch it selects the branch's
 * own rows plus the main rows the branch has not shadowed, and hides
 * tombstones.
 *
 * The predicate has to be part of the database query rather than applied
 * afterwards: filtering, sorting, `totalDocs` and pagination are all computed
 * by the database, and a post-query pass cannot correct any of them.
 */
export const appendBranchFilter = ({
  branch,
  deletedIDs,
  enabled,
  shadowedIDs,
  where,
}: Args): Where => {
  if (!enabled) {
    return where
  }

  if (branch === MAIN_BRANCH) {
    return and(where, { [branchField]: { equals: MAIN_BRANCH } })
  }

  // Excluded by their own `id`, not by `_branchDocID`. For a main row the
  // canonical ID *is* its primary key — `_branchDocID` is null there, meaning
  // "self", so comparing against it would never match and the shadowed main row
  // would be returned alongside the branch's copy.
  const mainRows: Where = shadowedIDs.length
    ? {
        and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { not_in: shadowedIDs } }],
      }
    : { [branchField]: { equals: MAIN_BRANCH } }

  // A delete change is authoritative. Exclude its branch row by canonical ID
  // rather than relying on mutable bookkeeping stored on the tombstone itself.
  const branchRows: Where = deletedIDs.length
    ? {
        and: [
          { [branchField]: { equals: branch } },
          { [branchDocIDField]: { not_in: deletedIDs } },
        ],
      }
    : { [branchField]: { equals: branch } }

  return and(where, { or: [branchRows, mainRows] })
}
