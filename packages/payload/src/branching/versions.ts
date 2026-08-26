import type { Payload } from '../index.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { rewriteBranchVersionParents } from './branchIDs.js'
import { loadBranchDeletions, loadBranchManifest, resolveBranch } from './resolveBranch.js'
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

  if (branch === MAIN_BRANCH) {
    const mainBase = where && Object.keys(where).length ? [where] : []

    return { and: [...mainBase, { [branchField]: { equals: MAIN_BRANCH } }] }
  }

  // `id` arrives here as `parent` (`appendVersionToQueryKey`), and on a branch a version
  // row's `parent` is the shadow row while the caller means the canonical document. Same
  // rewrite the history query does — without it, filtering a drafts read by document ID
  // matched nothing on a branch while working on main, which is the admin panel's own
  // read of a single draft.
  const base = (() => {
    const rewritten = rewriteBranchVersionParents(where)

    return rewritten && Object.keys(rewritten).length ? [rewritten] : []
  })()

  const manifest = await loadBranchManifest(req as PayloadRequest)
  const shadowedIDs = manifest.get(collectionSlug) ?? []
  const deletedIDs = (await loadBranchDeletions(req as PayloadRequest)).get(collectionSlug) ?? []

  const mainVersions: Where = shadowedIDs.length
    ? { and: [{ [branchField]: { equals: MAIN_BRANCH } }, { parent: { not_in: shadowedIDs } }] }
    : { [branchField]: { equals: MAIN_BRANCH } }

  // A tombstone is a flag on the collection row, which version rows know nothing
  // about — so a document deleted on this branch would keep its branch version
  // chain and go on appearing in drafts reads, while every other read on the
  // branch treats it as gone. `_branchParent` is a relationship field, so
  // `not_in` is null-safe on relational adapters as well as Mongo.
  const branchVersions: Where = deletedIDs.length
    ? {
        and: [
          { [branchField]: { equals: branch } },
          { [branchParentField]: { not_in: deletedIDs } },
        ],
      }
    : { [branchField]: { equals: branch } }

  return {
    and: [...base, { or: [branchVersions, mainVersions] }],
  }
}

/**
 * Branch predicate for reading version *history*, as opposed to listing drafts.
 *
 * A branch's history reads as a continuation of main's: main's versions up to the
 * point the branch forked are the branch's ancestry, the branch's own versions sit
 * on top, and no other branch is visible. Anything main recorded after the fork
 * belongs to main alone — it is not this branch's past.
 *
 * Deliberately *not* {@link resolveBranchVersionQuery}. That one hides main's
 * versions for any shadowed document, which is right when listing one row per
 * document and exactly wrong here: those hidden rows are the ancestry.
 */
export const resolveBranchVersionHistoryQuery = ({
  branch: branchOverride,
  collectionSlug,
  req,
  where,
}: QueryArgs): undefined | Where => {
  if (bypassed(branchOverride, req)) {
    return where
  }

  const branching = req!.payload!.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return where
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    const base = where && Object.keys(where).length ? [where] : []

    return { and: [...base, { [branchField]: { equals: MAIN_BRANCH } }] }
  }

  const rewritten = rewriteBranchVersionParents(where)
  const base = rewritten && Object.keys(rewritten).length ? [rewritten] : []

  // Main's history is the branch's ancestry, so it is included rather than hidden.
  //
  // Not yet cut off at the fork point: versions main records *after* the branch
  // forked are not the branch's past, but the only marker available is
  // `baseUpdatedAt` — main's *document* `updatedAt` at fork — and version rows are
  // written just after the document, so comparing against it excludes main's latest
  // version, the one that matters most. Cutting this off needs a fork-time marker
  // of its own; `baseUpdatedAt` cannot be repurposed because §16's "main moved"
  // warning depends on its current meaning.
  const mainHistory: Where = { [branchField]: { equals: MAIN_BRANCH } }

  return {
    and: [...base, { or: [{ [branchField]: { equals: branch } }, mainHistory] }],
  }
}

/**
 * Restores canonical document IDs on version rows read from a branch, whose
 * `parent` is the shadow row rather than the document.
 */
export const projectBranchVersionParents = (docs: Record<string, any>[]): void => {
  for (const doc of docs) {
    const canonical = doc?.[branchParentField]

    if (canonical !== undefined && canonical !== null) {
      doc.parent = typeof canonical === 'object' ? canonical.value : canonical
    }
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

/**
 * The version rows this branch owns for one document.
 *
 * Every operation that reaches into an existing version chain needs this, not just
 * deletes: a cascade after a delete, pruning to `maxPerDoc`, and rewriting the latest
 * row on unpublish are all the same question — which rows belong to the branch doing
 * the writing.
 *
 * Deleting a document cascades to its versions by `parent`. On a branch that is
 * destructive: the delete becomes a tombstone rather than a real delete, but the
 * cascade still names the canonical ID — which is main's `parent` — so main loses
 * its version chain while its row survives. A published document then vanishes
 * from main's own drafts list, and nothing about the branch says why.
 *
 * Adding `_branch` makes the cascade hit only the rows belonging to the branch in
 * play. It also protects a branch's chain from a delete performed on main, whose
 * versions share no `parent` with it but are cheap to exclude explicitly.
 */
export const resolveBranchOwnVersions = async ({
  id,
  branch: branchOverride,
  collectionSlug,
  req,
}: {
  branch?: false | string
  collectionSlug: string
  id: number | string
  req?: Partial<PayloadRequest>
}): Promise<Where> => {
  const unscoped: Where = { parent: { equals: id } }

  if (bypassed(branchOverride, req)) {
    return unscoped
  }

  const branching = req!.payload!.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return unscoped
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    return { and: [unscoped, { [branchField]: { equals: MAIN_BRANCH } }] }
  }

  // The branch's own versions hang off its shadow row, so the cascade has to
  // address that row rather than the canonical ID. When the branch has no copy
  // yet, `resolveBranchRowID` returns the canonical ID — and the `_branch`
  // constraint is what then keeps the cascade off main's rows.
  const rowID = await resolveBranchRowID({ id, collectionSlug, req })

  return { and: [{ parent: { equals: rowID } }, { [branchField]: { equals: branch } }] }
}

/**
 * Drops a branch's version chain for one document.
 *
 * Every way a branch stops owning a document ends here: merged, discarded, or
 * promoted to main. A branch's versions hang off its *shadow row's* primary key
 * rather than the canonical ID, so they do not travel with the document and are not
 * cascaded by anything that addresses it — they have to be deleted deliberately.
 *
 * Leaving them behind is not inert. The drafts list reads through versions, so an
 * orphaned branch chain keeps answering for a document the branch no longer has a
 * row for: the branch lists the document twice, once from its stale chain and once
 * from main's, as two identical rows.
 *
 * Scoped by `_branch` as well as `parent`: main's chain shares no parent with this
 * one, but saying so costs nothing and a wrong delete here would strip production
 * history. `_branchParent` is required for the same reason — only rows that were
 * written as branch versions are in scope.
 */
export const deleteBranchVersionChain = async ({
  branch,
  collectionSlug,
  payload,
  req,
  rowID,
}: {
  branch: string
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  /** Primary key the branch's versions hang off — the shadow row, not the document. */
  rowID: number | string
}): Promise<void> => {
  // Asking a collection without versions to delete versions throws, and a
  // branchable collection need not be versioned.
  if (!payload.collections[collectionSlug]?.config.versions) {
    return
  }

  await payload.db.deleteVersions({
    collection: collectionSlug,
    req,
    where: {
      and: [
        { parent: { equals: rowID } },
        { [branchField]: { equals: branch } },
        { [branchParentField]: { exists: true } },
      ],
    },
  })
}
