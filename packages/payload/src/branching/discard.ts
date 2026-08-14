import type { Payload, PayloadRequest } from '../types/index.js'
import type { BranchOperation } from './types.js'

import { createLocalReq } from '../utilities/createLocalReq.js'
import { killTransaction } from '../utilities/killTransaction.js'
import { assertBranchWritable } from './assertBranchWritable.js'
import { resetBranchState, withoutBranch } from './resolveBranch.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchesCollectionSlug,
  branchField,
} from './types.js'
import { deleteBranchVersionChain } from './versions.js'

export type DiscardedChange = {
  changeID: number | string
  /** Absent for a global. */
  collectionSlug?: string
  /** Absent for a global. */
  docID?: number | string
  entityType: 'collection' | 'global'
  globalSlug?: string
  operation: BranchOperation
}

export type DiscardResult = {
  discarded: DiscardedChange[]
}

export type DiscardOptions = {
  branch: string
  /** Change IDs to discard. Omit to discard everything pending on the branch. */
  changes?: (number | string)[]
  req?: PayloadRequest
  user?: NonNullable<PayloadRequest['user']>
}

/**
 * Throws away a branch's changes, returning the documents to main's state.
 *
 * The mirror of merge, and structurally simpler: merge has to reconcile with
 * production, while discard only has to forget. Every operation reduces to the same
 * act — drop the branch's row — because the branch's row *is* the change:
 *
 * - **create** — the row is the document, so dropping it removes it from the branch.
 * - **update** — the row is the branch's copy, so dropping it makes the branch read
 *   through to main again.
 * - **delete** — the row is the tombstone, so dropping it un-hides main's document.
 *
 * Nothing on `main` is touched in any of the three, which is why this needs no
 * per-document preflight the way merge does (§13): a branch is a proposal, and
 * withdrawing a proposal is not a production write.
 *
 * One hazard is unresolved and shared with §16's discussion of merge: dropping a
 * branch-**created** row cascade-deletes inbound `_rels` rows, including from main
 * documents that were pointed at it on this branch. The plan's `broken-reference`
 * warning (test 48) is not implemented yet, so that reference is silently severed.
 */
export const discardBranchChanges = async (
  payload: Payload,
  { branch, changes: selected, req: incomingReq, user }: DiscardOptions,
): Promise<DiscardResult> => {
  // `branch: false` throughout, as with merge: the rows being dropped are addressed
  // by their real primary keys, so the read predicate must not be in the way.
  const req = incomingReq
    ? withoutBranch(incomingReq)
    : await createLocalReq({ branch: false, user }, payload)

  if (user && !req.user) {
    req.user = user
  }

  const branchDocs = await payload.find({
    collection: branchesCollectionSlug,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { slug: { equals: branch } },
  })

  if (!branchDocs.docs[0]) {
    throw new Error(`Branch "${branch}" was not found.`)
  }

  // Discarding is a write, so a closed branch refuses it — its archive is a record,
  // and a record that can be edited is not one.
  await assertBranchWritable({ branch, req })

  const allChanges = await payload.find({
    collection: branchChangesCollectionSlug,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'createdAt',
    where: {
      branch: { equals: branch },
    },
  })

  const applicable = allChanges.docs.filter(
    (change) => !selected || selected.map(String).includes(String(change.id)),
  )

  const result: DiscardResult = { discarded: [] }

  if (!applicable.length) {
    return result
  }

  const shouldCommit = !incomingReq && (await payload.db.beginTransaction?.())

  if (shouldCommit) {
    req.transactionID = shouldCommit
  }

  try {
    for (const change of applicable) {
      // A global has no shadow row to look up and no tombstone to undo: its branch copy
      // *is* the change, so dropping the copy is the entire discard, and the branch reads
      // through to main again immediately.
      if (change.entityType === 'global') {
        const globalSlug = change.globalSlug as string

        if (!payload.db.deleteBranchGlobal) {
          throw new Error(
            `The database adapter cannot remove a branch's copy of a global, so "${globalSlug}" cannot be discarded.`,
          )
        }

        await payload.db.deleteBranchGlobal({ branch, globalSlug, req })

        await payload.delete({
          id: change.id,
          collection: branchChangesCollectionSlug,
          overrideAccess: true,
          req,
        })

        result.discarded.push({
          changeID: change.id,
          entityType: 'global',
          globalSlug,
          operation: 'update',
        })

        continue
      }

      const collectionSlug = change.collectionSlug as string
      const docID = (change.doc as { value?: number | string })?.value ?? change.doc

      const shadow = (await payload.db.findOne({
        branch: false,
        collection: collectionSlug,
        req,
        where: {
          and: [
            { [branchField]: { equals: branch } },
            { or: [{ id: { equals: docID } }, { [branchDocIDField]: { equals: docID } }] },
          ],
        },
      })) as null | Record<string, unknown>

      if (shadow) {
        await deleteBranchVersionChain({
          branch,
          collectionSlug,
          payload,
          req,
          rowID: shadow.id as number | string,
        })

        await payload.db.deleteOne({
          branch: false,
          collection: collectionSlug,
          req,
          where: { id: { equals: shadow.id } },
        })
      }

      await payload.delete({
        id: change.id,
        collection: branchChangesCollectionSlug,
        overrideAccess: true,
        req,
      })

      result.discarded.push({
        changeID: change.id,
        collectionSlug,
        docID: docID as number | string,
        entityType: 'collection',
        operation: change.operation as BranchOperation,
      })
    }

    if (shouldCommit) {
      await payload.db.commitTransaction?.(shouldCommit)
    }
  } catch (error) {
    await killTransaction(req)
    throw error
  }

  // The manifest this request memoized still lists the discarded documents as
  // shadowed, which would hide main's copies from any later read on this request.
  resetBranchState(req)

  return result
}
