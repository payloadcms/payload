import type { PayloadRequest, Where } from '../types/index.js'

import { assertBranchWritable } from './assertBranchWritable.js'
import { createShadowRow } from './createShadowRow.js'
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
 * Whether a delete will be absorbed into a tombstone rather than removing a row.
 *
 * `deleteByID` runs its cascades — associated files, scheduled publish jobs —
 * before `db.deleteOne` decides this, and each of them addresses the canonical
 * document. On a branch that means reaching into main: deleting an upload on a
 * branch unlinks main's file while main keeps the row that points at it.
 *
 * Answered from the document already fetched for the delete, so it costs no extra
 * read. A document created on the branch is exempt — nothing of main's stands
 * behind it, so its side effects are its own to clean up.
 */
export const willBranchAbsorbDelete = ({
  collectionSlug,
  doc,
  req,
}: {
  branch?: false | string
  collectionSlug: string
  doc: null | Record<string, unknown> | undefined
  req?: Partial<PayloadRequest>
}): boolean => {
  if (!doc || !req?.payload) {
    return false
  }

  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return false
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return false
  }

  const branch = resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    return false
  }

  return !(doc[branchField] === branch && doc[branchOpField] === 'create')
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

  // A delete is a write like any other, and a closed branch takes none.
  await assertBranchWritable({ branch, req: req as PayloadRequest })

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
  } else {
    const { id: _discardedID, ...data } = target

    // Two concurrent deletes of the same never-forked document on the same
    // branch both land here — the row create is what can lose that race, so
    // it (and the bookkeeping that must land with it) runs isolated from the
    // caller's own transaction. A losing side simply accepts the winner's
    // tombstone rather than recording a second one.
    await createShadowRow({
      branch,
      collectionSlug,
      data: {
        ...data,
        [branchDocIDField]: canonicalID,
        [branchField]: branch,
        [branchOpField]: 'delete',
      },
      docID: canonicalID,
      onCreated: async (createReq) => {
        await createReq.payload.db.deleteMany({
          collection: branchChangesCollectionSlug,
          req: createReq,
          where: {
            and: [{ branch: { equals: branch } }, { 'doc.value': { equals: canonicalID } }],
          },
        })

        await createReq.payload.create({
          collection: branchChangesCollectionSlug,
          data: {
            branch,
            collectionSlug,
            doc: { relationTo: collectionSlug, value: canonicalID },
            entityType: 'collection',
            operation: 'delete',
          },
          overrideAccess: true,
          req: createReq,
        })
      },
      req: req as PayloadRequest,
    })
  }

  resetBranchState(req as PayloadRequest)
  ;(req as PayloadRequest).branch = branch

  return { doc: { ...target, id: canonicalID }, tombstoned: true }
}
