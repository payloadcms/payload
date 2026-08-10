import type { PayloadRequest, Where } from '../types/index.js'

import { appendBranchFilter } from './appendBranchFilter.js'
import { rewriteBranchIDs } from './branchIDs.js'
import { loadBranchManifest, resolveBranch } from './resolveBranch.js'
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
      enabled: true,
      shadowedIDs: [],
      where: where ?? {},
    })
  }

  const manifest = await loadBranchManifest(req as PayloadRequest)
  const shadowedIDs = collectionSlug ? (manifest.get(collectionSlug) ?? []) : []

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
    enabled: true,
    shadowedIDs,
    where: rewritten ?? {},
  })
}
