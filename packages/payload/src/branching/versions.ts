import type { PayloadRequest, Where } from '../types/index.js'

import { loadBranchManifest, resolveBranch } from './resolveBranch.js'
import { resolveBranchRowID } from './resolveBranchRowID.js'
import { branchField, branchParentField, MAIN_BRANCH } from './types.js'

type QueryArgs = {
  branch?: false | string
  collectionSlug: string
  req?: Partial<PayloadRequest>
  where: undefined | Where
}

const bypassed = (branch: false | string | undefined, req?: Partial<PayloadRequest>): boolean =>
  branch === false ||
  !req?.payload ||
  Boolean((req.context as Record<string, unknown> | undefined)?._branchBypass)

/**
 * Branch predicate for version queries.
 *
 * Mirrors the collection predicate, but a version row's canonical identity is
 * its `parent` on main and its `_branchParent` on a branch — so the exclusion of
 * shadowed main versions compares `parent`, which for a main version row is
 * already the canonical document ID.
 */
export const resolveBranchVersionQuery = async ({
  branch: branchOverride,
  collectionSlug,
  req,
  where,
}: QueryArgs): Promise<undefined | Where> => {
  if (bypassed(branchOverride, req)) {
    return where
  }

  const branching = req!.payload!.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return where
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  const base = where && Object.keys(where).length ? [where] : []

  if (branch === MAIN_BRANCH) {
    return { and: [...base, { [branchField]: { equals: MAIN_BRANCH } }] }
  }

  const manifest = await loadBranchManifest(req as PayloadRequest)
  const shadowedIDs = manifest.get(collectionSlug) ?? []

  const mainVersions: Where = shadowedIDs.length
    ? { and: [{ [branchField]: { equals: MAIN_BRANCH } }, { parent: { not_in: shadowedIDs } }] }
    : { [branchField]: { equals: MAIN_BRANCH } }

  return {
    and: [...base, { or: [{ [branchField]: { equals: branch } }, mainVersions] }],
  }
}

/**
 * Attaches a new version to the branch's own copy of the document.
 *
 * Without this a draft saved on a branch would append to main's version chain,
 * which is both visible on main and destructive to its `latest` bookkeeping.
 */
export const resolveBranchVersionParent = async ({
  branch: branchOverride,
  collectionSlug,
  parent,
  req,
  versionData,
}: {
  branch?: false | string
  collectionSlug: string
  parent: number | string
  req?: Partial<PayloadRequest>
  versionData: Record<string, unknown>
}): Promise<{ parent: number | string; versionData: Record<string, unknown> }> => {
  if (bypassed(branchOverride, req)) {
    return { parent, versionData }
  }

  const branching = req!.payload!.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return { parent, versionData }
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    return { parent, versionData }
  }

  const rowID = await resolveBranchRowID({ id: parent, collectionSlug, req })

  return {
    parent: rowID,
    versionData: {
      ...versionData,
      [branchField]: branch,
      [branchParentField]: parent,
    },
  }
}

/**
 * Restores canonical document IDs on rows returned by `queryDrafts`, which
 * surfaces a version's `parent` as the document ID.
 */
export const projectBranchVersionParent = (row: Record<string, any>): number | string =>
  row?.[branchParentField]?.value ?? row?.[branchParentField] ?? row?.parent
