import type { PayloadRequest, Where } from '../types/index.js'

import { appendBranchFilter } from './appendBranchFilter.js'
import { rewriteBranchIDs } from './branchIDs.js'
import {
  loadBranchDeletions,
  loadBranchManifest,
  peekBranchDeletions,
  peekBranchManifest,
  resolveBranch,
} from './resolveBranch.js'
import { MAIN_BRANCH } from './types.js'

type Args = {
  /**
   * Explicit override. `false` bypasses branching entirely — used by the merge
   * engine, which must reach shadow rows by their real primary key, and by
   * cross-branch reads such as diff views.
   */
  branch?: false | string
  collectionSlug?: string
  globalSlug?: string
  req?: Partial<PayloadRequest>
  where: undefined | Where
}

export type BranchReadState = {
  branch: string
  useBranching: boolean
}

export const resolveBranchReadState = ({
  branch: branchOverride,
  collectionSlug,
  globalSlug,
  req,
}: Omit<Args, 'where'>): BranchReadState => {
  const branching = req?.payload?.config?.branching
  const isBranchable = collectionSlug
    ? Boolean(branching?.branchableCollections.has(collectionSlug))
    : globalSlug
      ? Boolean(branching?.branchableGlobals.has(globalSlug))
      : false
  const isRequestBypassed = Boolean(
    (req?.context as Record<string, unknown> | undefined)?._branchBypass,
  )
  const isBypassed = branchOverride === false || isRequestBypassed

  if (isRequestBypassed && req?.payload) {
    resolveBranch(req as PayloadRequest)
  }

  if (!branching?.enabled || !isBranchable || isBypassed) {
    return {
      branch: typeof branchOverride === 'string' ? branchOverride : MAIN_BRANCH,
      useBranching: false,
    }
  }

  const branch =
    typeof branchOverride === 'string'
      ? branchOverride
      : req?.payload
        ? resolveBranch(req as PayloadRequest)
        : MAIN_BRANCH

  return {
    branch,
    useBranching: branch !== MAIN_BRANCH,
  }
}

/**
 * The single entry point adapters call to make a read branch-aware.
 *
 * Lives in `payload` rather than in each adapter so that Mongo and Drizzle
 * cannot drift apart on branch semantics — adapters supply only the query
 * translation they already do.
 *
 * Returns `where` untouched when branching is off, when the entity is not
 * branch-enabled, or when the caller opted out, so a branching-disabled config
 * takes the same code path it does today.
 */
export const resolveBranchQuery = async ({
  branch: branchOverride,
  collectionSlug,
  globalSlug,
  req,
  where,
}: Args): Promise<undefined | Where> => {
  if (branchOverride === false || !req?.payload) {
    return where
  }

  // Local API `branch: false` bypass, carried on context so it survives the
  // hop from operation options into the adapter.
  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return where
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled) {
    return where
  }

  const isBranchable = collectionSlug
    ? branching.branchableCollections.has(collectionSlug)
    : globalSlug
      ? branching.branchableGlobals.has(globalSlug)
      : false

  if (!isBranchable) {
    return where
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    return appendBranchFilter({
      branch,
      deletedIDs: [],
      enabled: true,
      shadowedIDs: [],
      where: where ?? {},
    })
  }

  const [manifest, deletions] = await Promise.all([
    loadBranchManifest(req as PayloadRequest),
    loadBranchDeletions(req as PayloadRequest),
  ])
  const shadowedIDs = collectionSlug ? (manifest.get(collectionSlug) ?? []) : []
  const deletedIDs = collectionSlug ? (deletions.get(collectionSlug) ?? []) : []

  // A shadow row's primary key is not the document's canonical ID, so any `id`
  // constraint has to be redirected before the branch predicate is applied.
  const rewritten = rewriteBranchIDs(where ?? {})

  if (shadowedIDs.length > branching.maxShadowedIDs) {
    req.payload.logger.warn(
      `Branch "${branch}" has shadowed ${shadowedIDs.length} documents in "${collectionSlug}", above maxShadowedIDs (${branching.maxShadowedIDs}). Read performance will degrade.`,
    )
  }

  return appendBranchFilter({
    branch,
    deletedIDs,
    enabled: true,
    shadowedIDs,
    where: rewritten ?? {},
  })
}

/**
 * Synchronous branch predicate, for query builders that are not async.
 *
 * Reads the change manifest that `resolveBranchQuery` has already loaded and
 * memoized on the request earlier in the same read. Returns `null` when
 * branching is inactive for the entity, so callers can skip cleanly.
 *
 * Join subqueries need this: they are assembled inside synchronous query
 * builders, but must carry the same branch predicate as the top-level read or
 * a branch would see main's related documents.
 */
export const getBranchPredicateSync = ({
  branch: branchOverride,
  collectionSlug,
  req,
}: {
  branch?: false | string
  collectionSlug: string
  req?: Partial<PayloadRequest>
}): null | Where => {
  if (branchOverride === false || !req?.payload) {
    return null
  }

  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return null
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return null
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  const shadowedIDs =
    branch === MAIN_BRANCH
      ? []
      : (peekBranchManifest(req as PayloadRequest).get(collectionSlug) ?? [])
  const deletedIDs =
    branch === MAIN_BRANCH
      ? []
      : (peekBranchDeletions(req as PayloadRequest).get(collectionSlug) ?? [])

  return appendBranchFilter({ branch, deletedIDs, enabled: true, shadowedIDs, where: {} })
}
