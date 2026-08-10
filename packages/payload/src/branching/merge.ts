import type { Payload, PayloadRequest } from '../types/index.js'
import type { BlockedChange } from './preflight.js'
import type { BranchOperation } from './types.js'

import { updateByIDOperation } from '../collections/operations/updateByID.js'
import { createLocalReq } from '../utilities/createLocalReq.js'
import { killTransaction } from '../utilities/killTransaction.js'
import { resolveEffectiveOperations, runMergePreflight } from './preflight.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchesCollectionSlug,
  branchField,
  branchOpField,
  MAIN_BRANCH,
} from './types.js'

export type MergeableChange = {
  changeID: number | string
  collectionSlug: string
  docID: number | string
  operation: BranchOperation
}

export type MergeWarning = {
  changeID: number | string
  collectionSlug: string
  docID: number | string
  message: string
  reason: 'main-moved'
}

export type MergeResult = {
  /** Changes the merging user is not permitted to apply. */
  blocked: BlockedChange[]
  /** True when at least one selected change can be applied. */
  canMerge: boolean
  mergeable: MergeableChange[]
  merged: MergeableChange[]
  warnings: MergeWarning[]
}

export type MergeOptions = {
  branch: string
  /** Change IDs to apply. Omit to apply every pending change. */
  changes?: (number | string)[]
  /** Report what would happen without writing anything. */
  dryRun?: boolean
  /**
   * Skip the per-document permission preflight, matching how every other Local
   * API operation defaults to trusting server-side callers.
   *
   * HTTP callers must pass `false` together with `user`: the preflight is the
   * enforcement boundary for branching, since branch writes are deliberately
   * permissive on the assumption that nothing is real until merge.
   *
   * @default true
   */
  overrideAccess?: boolean
  req?: PayloadRequest
  /**
   * The user whose production permissions the merge is checked against.
   * Defaults to `req.user`.
   */
  user?: NonNullable<PayloadRequest['user']>
}

const changeDocID = (change: Record<string, any>): number | string =>
  change.doc?.value ?? change.doc

/**
 * Applies a branch's changes to `main`.
 *
 * Branch data wins outright — there is no field-level reconciliation. What
 * replaces conflict resolution is selection: callers choose which changes to
 * apply, and anything left behind keeps the branch open.
 *
 * Every write runs through the ordinary Local API so that all document hooks,
 * validation and version creation behave exactly as they would for a hand-made
 * edit on main.
 */
export const mergeBranch = async (
  payload: Payload,
  {
    branch,
    changes: selected,
    dryRun = false,
    overrideAccess = true,
    req: incomingReq,
    user,
  }: MergeOptions,
): Promise<MergeResult> => {
  // `branch: false` throughout: merge addresses shadow rows by their real
  // primary key and writes to main, so it must not be branch-filtered itself.
  const req = incomingReq ?? (await createLocalReq({ branch: false, user }, payload))

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

  const branchDoc = branchDocs.docs[0]

  if (!branchDoc) {
    throw new Error(`Branch "${branch}" was not found.`)
  }

  const allChanges = await payload.find({
    collection: branchChangesCollectionSlug,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'createdAt',
    where: {
      and: [{ branch: { equals: branch } }, { entityType: { equals: 'collection' } }],
    },
  })

  const pending = allChanges.docs.filter(
    (change) => !selected || selected.map(String).includes(String(change.id)),
  )

  const resolved = await resolveEffectiveOperations({ branch, changes: pending, payload, req })

  // The enforcement boundary: a branch is a proposal, and this is where the
  // merging user's production permissions are actually applied.
  const blocked = overrideAccess ? [] : await runMergePreflight({ payload, pending: resolved, req })
  const blockedChangeIDs = new Set(blocked.map((each) => String(each.changeID)))

  const applicable = pending.filter((change) => !blockedChangeIDs.has(String(change.id)))

  const mergeable: MergeableChange[] = applicable.map((change) => ({
    changeID: change.id,
    collectionSlug: change.collectionSlug as string,
    docID: changeDocID(change),
    operation: change.operation as BranchOperation,
  }))

  const warnings: MergeWarning[] = []

  for (const change of applicable) {
    if (change.operation === 'create' || !change.baseUpdatedAt) {
      continue
    }

    const mainDoc = (await payload.db.findOne({
      branch: false,
      collection: change.collectionSlug as string,
      req,
      where: {
        and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: changeDocID(change) } }],
      },
    })) as null | Record<string, unknown>

    if (
      mainDoc?.updatedAt &&
      new Date(mainDoc.updatedAt as string) > new Date(change.baseUpdatedAt as string)
    ) {
      warnings.push({
        changeID: change.id,
        collectionSlug: change.collectionSlug as string,
        docID: changeDocID(change),
        message: `"${change.collectionSlug}" document ${changeDocID(change)} changed on main after it was branched. Merging will overwrite that change.`,
        reason: 'main-moved',
      })
    }
  }

  const result: MergeResult = {
    blocked,
    canMerge: mergeable.length > 0,
    mergeable,
    merged: [],
    warnings,
  }

  if (dryRun || !mergeable.length) {
    return result
  }

  const branchingHooks = payload.config.branching?.hooks

  await branchingHooks?.beforeMerge?.({ branch, changes: mergeable, req, warnings })

  const shouldCommit = !incomingReq && (await payload.db.beginTransaction?.())

  if (shouldCommit) {
    req.transactionID = shouldCommit
  }

  try {
    for (const change of applicable) {
      await applyChange({ branch, change, payload, req })
      await payload.delete({
        id: change.id,
        collection: branchChangesCollectionSlug,
        overrideAccess: true,
        req,
      })
      result.merged.push({
        changeID: change.id,
        collectionSlug: change.collectionSlug as string,
        docID: changeDocID(change),
        operation: change.operation as BranchOperation,
      })
    }

    const remaining = await payload.count({
      collection: branchChangesCollectionSlug,
      overrideAccess: true,
      req,
      where: { branch: { equals: branch } },
    })

    if (remaining.totalDocs === 0) {
      await payload.update({
        id: branchDoc.id,
        collection: branchesCollectionSlug,
        data: { mergedAt: new Date().toISOString(), status: 'merged' },
        overrideAccess: true,
        req,
      })
    }

    if (shouldCommit) {
      await payload.db.commitTransaction?.(shouldCommit)
    }
  } catch (error) {
    await killTransaction(req)
    throw error
  }

  // Fired after commit: a failing deploy webhook must not undo a merge.
  await branchingHooks?.afterMerge?.({ branch, req, results: result.merged })

  return result
}

const applyChange = async ({
  branch,
  change,
  payload,
  req,
}: {
  branch: string
  change: Record<string, any>
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  const collectionSlug = change.collectionSlug as string
  const docID = changeDocID(change)

  const shadow = await payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: {
      and: [
        { [branchField]: { equals: branch } },
        {
          or: [{ id: { equals: docID } }, { [branchDocIDField]: { equals: docID } }],
        },
      ],
    },
  })

  if (!shadow) {
    return
  }

  if (change.operation === 'delete') {
    await payload.delete({
      id: docID,
      branch: false,
      collection: collectionSlug,
      overrideAccess: true,
      req,
    })

    await payload.db.deleteOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: { id: { equals: shadow.id } },
    })

    return
  }

  const { id, _branch, _branchDocID, _branchOp, createdAt, updatedAt, ...data } = shadow as Record<
    string,
    unknown
  >

  if (change.operation === 'create') {
    // Updated in place rather than recreated. The row already holds the ID that
    // inbound relationships point at, and deleting it would cascade those
    // relationship rows away — rebuilding the row does not bring them back.
    // `operation: 'create'` still reports it as a create, because from main's
    // point of view the document is new.
    await updateByIDOperation({
      id: shadow.id,
      collection: payload.collections[collectionSlug]!,
      data: { ...data, [branchField]: MAIN_BRANCH, [branchOpField]: null } as never,
      operation: 'create',
      overrideAccess: true,
      req,
    })

    return
  }

  await payload.update({
    id: docID,
    branch: false,
    collection: collectionSlug,
    data: data as never,
    overrideAccess: true,
    req,
  })

  await payload.db.deleteOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: { id: { equals: shadow.id } },
  })
}

export const getBranchesLocalAPI = (payload: Payload) => ({
  merge: (options: MergeOptions) => mergeBranch(payload, options),
})
