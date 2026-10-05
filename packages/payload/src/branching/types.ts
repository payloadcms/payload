import type { CollectionSlug } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { Access } from './../config/types.js'
import type { BranchMergeValidate } from './validation.js'

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
/**
 * One row per merge event, append-only.
 *
 * Merging consumes the change rows it applies and drops the shadow rows behind
 * them, so without this a merged branch has no record of what it did. It is a
 * separate collection rather than a flag on `payload-branch-changes` because a
 * branch can be merged more than once (§16) — a change row belongs to exactly one
 * merge, so the event, not the change, is what needs its own identity.
 */
export const branchMergesCollectionSlug = 'payload-branch-merges'

/** Field injected onto every branch-enabled collection and its version collection. */
export const branchField = '_branch'
export const branchDocIDField = '_branchDocID'
export const branchParentField = '_branchParent'

export const branchOperations = ['create', 'update', 'delete'] as const
export const mergeApplicationOutcomes = [
  'unattempted',
  'attempted',
  'applied',
  'committed',
  'failed',
  'rolledBack',
  'unknown',
] as const
export const mergeCleanupOutcomes = [
  'pending',
  'completed',
  'failed',
  'notNeeded',
  'superseded',
  'unknown',
] as const
export const mergeRecoveryOutcomes = [
  'notNeeded',
  'pending',
  'restored',
  'deleted',
  'unavailable',
  'failed',
  'unknown',
] as const

export type BranchOperation = (typeof branchOperations)[number]
export type MergeApplicationOutcome = (typeof mergeApplicationOutcomes)[number]
export type MergeCleanupOutcome = (typeof mergeCleanupOutcomes)[number]
export type MergeRecoveryOutcome = (typeof mergeRecoveryOutcomes)[number]

export type MergeableChange = {
  changeID: number | string
  /** Absent for a global, which is identified by `globalSlug` instead. */
  collectionSlug?: string
  /** Absent for a global: there is one of it, so there is nothing to identify. */
  docID?: number | string
  entityType: 'collection' | 'global'
  globalSlug?: string
  operation: BranchOperation
}

export type MergeEventChange = {
  after?: unknown
  afterVersionID?: string
  applicationOutcome: MergeApplicationOutcome
  before?: unknown
  beforeVersionID?: string
  changeID: string
  cleanupError?: string
  cleanupOutcome: MergeCleanupOutcome
  collectionSlug?: string
  docID?: string
  docTitle: string
  error?: string
  globalSlug?: string
  operation: BranchOperation
  recoveryError?: string
  recoveryOutcome: MergeRecoveryOutcome
  sourceID?: string
  sourceRevision?: string
  sourceUpdatedAt?: string
  sourceVersionIDs?: (number | string)[]
  targetID?: string
}

export type MergeProgress = {
  collectionSlug: string
  /** 1-based position of the change being applied. */
  current: number
  docID: number | string
  operation: BranchOperation
  /** Total changes this merge will apply. */
  total: number
}

export type MergeWarning = {
  changeID: number | string
  collectionSlug: string
  docID: number | string
  message: string
  reason: 'main-moved'
}

export type BranchingConfig = {
  /**
   * Access control for branch lifecycle operations. Document-level access is
   * unchanged — `req.branch` is in scope inside existing access functions.
   */
  access?: {
    createBranch?: Access
    deleteBranch?: Access
    readBranch?: Access
    updateBranch?: Access
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
      req: PayloadRequest
      results: MergeableChange[]
    }) => Promise<void> | void
    /** Throw to block a merge. */
    beforeMerge?: (args: {
      branch: string
      changes: MergeableChange[]
      req: PayloadRequest
      warnings: MergeWarning[]
    }) => Promise<void> | void
  }
  /**
   * Ceiling on the number of shadowed document IDs injected into a single read
   * predicate by database adapters that use the legacy branch visibility fallback.
   * Official adapters use database-native branch visibility instead.
   *
   * @deprecated Retained for adapters that use the legacy branch visibility fallback.
   * @default 2000
   */
  maxShadowedIDs?: number
  /**
   * Replaces the default best-effort pre-merge content validation policy.
   * Ordinary write validation, hooks, access control, and database constraints still apply.
   */
  validate?: BranchMergeValidate
}

export type SanitizedBranchingConfig = {
  /** Slugs of every collection branching is active for. */
  branchableCollections: Set<string>
  /** Slugs of every global branching is active for. */
  branchableGlobals: Set<string>
  enabled: boolean
  maxShadowedIDs: number
  validate: BranchMergeValidate
} & Omit<BranchingConfig, 'exclude' | 'validate'>

/**
 * The branching config as it reaches the browser: which entities branch, and
 * nothing else. Access functions and merge hooks stay on the server, and the
 * `Set`s become arrays so the config remains plain JSON.
 */
export type ClientBranchingConfig = {
  branchableCollections: string[]
  branchableGlobals: string[]
  enabled: boolean
}
