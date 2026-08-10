import type { PayloadRequest, Where } from '../types/index.js'

import { resetBranchState, resolveBranch } from './resolveBranch.js'
import { resolveBranchQuery } from './resolveBranchQuery.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchField,
  branchOpField,
  MAIN_BRANCH,
} from './types.js'

type Args = {
  branch?: false | string
  collectionSlug: string
  req?: Partial<PayloadRequest>
  where: undefined | Where
}

type Result = {
  /** Narrows the caller's delete to this row's primary key. */
  deleteRowID?: number | string
  /** The document to report as deleted, when the delete was absorbed. */
  doc?: Record<string, unknown>
  /** True when the delete became a tombstone and must not proceed. */
  tombstoned: boolean
}

/**
 * Turns a delete on a branch into a tombstone against main.
 *
 * A branch cannot delete production content, so deleting a main document from
 * a branch records the intent instead: a shadow row marked `_branchOp: delete`,
 * which the read predicate hides on that branch and nowhere else.
 *
 * A document created on the branch has no main row behind it, so it is deleted
 * outright — nothing is left to hide.
 */
export const resolveBranchDelete = async ({
  branch: branchOverride,
  collectionSlug,
  req,
  where,
}: Args): Promise<Result> => {
  if (branchOverride === false || !req?.payload) {
    return { tombstoned: false }
  }

  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return { tombstoned: false }
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return { tombstoned: false }
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    return { tombstoned: false }
  }

  // Resolve which row the caller means *on this branch* — the branch's own copy
  // if it has one, otherwise the main row.
  const branchedWhere = await resolveBranchQuery({ collectionSlug, req, where })

  const target = (await req.payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: branchedWhere,
  })) as null | Record<string, unknown>

  if (!target) {
    return { tombstoned: false }
  }

  const targetID = target.id as number | string
  const isOnThisBranch = target[branchField] === branch

  // Created on this branch: no main row stands behind it, so a real delete
  // leaves nothing to hide.
  if (isOnThisBranch && target[branchOpField] === 'create') {
    await req.payload.db.deleteMany({
      collection: branchChangesCollectionSlug,
      req,
      where: { and: [{ branch: { equals: branch } }, { 'doc.value': { equals: targetID } }] },
    })

    return { deleteRowID: targetID, tombstoned: false }
  }

  const canonicalID =
    (target[branchDocIDField] as any)?.value ?? target[branchDocIDField] ?? targetID

  if (isOnThisBranch) {
    // Already forked — turn the existing copy into the tombstone rather than
    // adding a second row for the same document.
    await req.payload.db.updateOne({
      id: targetID,
      branch: false,
      collection: collectionSlug,
      data: { [branchOpField]: 'delete' },
      req,
    })
  } else {
    const { id: _discardedID, ...data } = target

    await req.payload.db.create({
      collection: collectionSlug,
      data: {
        ...data,
        [branchDocIDField]: canonicalID,
        [branchField]: branch,
        [branchOpField]: 'delete',
      },
      req,
    })
  }

  await req.payload.db.deleteMany({
    collection: branchChangesCollectionSlug,
    req,
    where: { and: [{ branch: { equals: branch } }, { 'doc.value': { equals: canonicalID } }] },
  })

  await req.payload.create({
    collection: branchChangesCollectionSlug,
    data: {
      branch,
      collectionSlug,
      doc: { relationTo: collectionSlug, value: canonicalID },
      entityType: 'collection',
      operation: 'delete',
    },
    overrideAccess: true,
    req,
  })

  resetBranchState(req as PayloadRequest)
  ;(req as PayloadRequest).branch = branch

  return { doc: { ...target, id: canonicalID }, tombstoned: true }
}
