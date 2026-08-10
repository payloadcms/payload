import type { CollectionSlug } from '../index.js'
import type { Access } from './../config/types.js'

/**
 * The reserved `_branch` value for production content.
 *
 * A non-null sentinel rather than NULL: Postgres treats NULLs as distinct in
 * unique indexes, so a compound `(field, _branch)` unique index would stop
 * enforcing uniqueness among main rows if this were null.
 */
export const MAIN_BRANCH = 'main'

export const branchesCollectionSlug = 'payload-branches'
export const branchChangesCollectionSlug = 'payload-branch-changes'

/** Field injected onto every branch-enabled collection and its version collection. */
export const branchField = '_branch'
export const branchDocIDField = '_branchDocID'
export const branchOpField = '_branchOp'
export const branchParentField = '_branchParent'

export type BranchOperation = 'create' | 'delete' | 'update'

export type BranchingConfig = {
  /**
   * Access control for branch lifecycle operations. Document-level access is
   * unchanged — `req.branch` is in scope inside existing access functions.
   */
  access?: {
    createBranch?: Access
    readBranch?: Access
  }
  /**
   * Collections to exclude from branching, in addition to the defaults.
   */
  exclude?: CollectionSlug[]
  /**
   * Branch lifecycle hooks. Document hooks are unaffected — every one of them
   * runs on merge, since merge is a genuine write to main.
   */
  hooks?: {
    /** Fires after commit, so a failing webhook cannot undo a merge. */
    afterMerge?: (args: {
      branch: string
      req: unknown
      results: unknown[]
    }) => Promise<void> | void
    /** Throw to block a merge. */
    beforeMerge?: (args: {
      branch: string
      changes: unknown[]
      req: unknown
      warnings: unknown[]
    }) => Promise<void> | void
  }
  /**
   * Ceiling on the number of shadowed document IDs injected into a single read
   * predicate before falling back to a scalar strategy.
   *
   * @default 2000
   */
  maxShadowedIDs?: number
}

export type SanitizedBranchingConfig = {
  /** Slugs of every collection branching is active for. */
  branchableCollections: Set<string>
  /** Slugs of every global branching is active for. */
  branchableGlobals: Set<string>
  enabled: boolean
  maxShadowedIDs: number
} & Omit<BranchingConfig, 'exclude'>
