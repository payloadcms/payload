import type { Payload, PayloadRequest } from '../types/index.js'
import type { DiscardOptions } from './discard.js'
import type { ResolvedChange } from './effectiveOperations.js'
import type { BlockedChange } from './preflight.js'
import type { BranchOperation } from './types.js'

import { updateByIDOperation } from '../collections/operations/updateByID.js'
import { copyDataWithFreshRowIDs } from '../collections/operations/utilities/copyDataWithFreshRowIDs.js'
import { createLocalReq } from '../utilities/createLocalReq.js'
import { killTransaction } from '../utilities/killTransaction.js'
import { discardBranchChanges } from './discard.js'
import { resolveEffectiveOperations } from './effectiveOperations.js'
import { runGlobalMergePreflight, runMergePreflight } from './preflight.js'
import { isolateBranchState, withoutBranch } from './resolveBranch.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchesCollectionSlug,
  branchField,
  branchMergesCollectionSlug,
  branchOpField,
  MAIN_BRANCH,
} from './types.js'
import { deleteBranchVersionChain } from './versions.js'

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

/**
 * Emitted once per change, immediately before it is applied.
 *
 * A merge is a sequential loop over an arbitrary number of documents, so it is
 * the one Payload operation where "what is it doing right now" is a real
 * question. Reported by callback rather than persisted: the caller decides
 * whether that means a streamed HTTP response, a log line, or nothing.
 */
export type MergeProgress = {
  collectionSlug: string
  /** 1-based position of the change being applied. */
  current: number
  docID: number | string
  operation: BranchOperation
  /** Total changes this merge will apply. */
  total: number
}

export type MergeOptions = {
  branch: string
  /** Change IDs to apply. Omit to apply every pending change. */
  changes?: (number | string)[]
  /**
   * Close the branch once everything it held has been applied.
   *
   * Closing is terminal: a closed branch rejects writes and cannot be merged
   * again. Offered as a choice at merge time rather than implied by merging,
   * because "merge and keep working" and "merge and be done" are both ordinary
   * intents and only the author knows which one this is. Ignored when changes are
   * left behind — a branch with pending work is not finished by definition.
   *
   * @default false
   */
  closeBranch?: boolean
  /** Report what would happen without writing anything. */
  dryRun?: boolean
  /**
   * Called before each change is applied. Awaited, so a slow consumer throttles
   * the merge rather than falling behind it.
   */
  onProgress?: (progress: MergeProgress) => Promise<void> | void
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
    closeBranch = false,
    dryRun = false,
    onProgress,
    overrideAccess = true,
    req: incomingReq,
    user,
  }: MergeOptions,
): Promise<MergeResult> => {
  // `branch: false` throughout: merge addresses shadow rows by their real
  // primary key and writes to main, so it must not be branch-filtered itself.
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
    where: { branch: { equals: branch } },
  })

  const selectedChanges = allChanges.docs.filter(
    (change) => !selected || selected.map(String).includes(String(change.id)),
  )

  // Globals travel the same registry but not the same pipeline: there is one of each, so
  // there is no shadow row to resolve, no effective-operation table to consult (§7 is
  // about create/update/delete of documents) and nothing to collide on a unique index.
  const pending = selectedChanges.filter((change) => change.entityType !== 'global')
  const pendingGlobals = selectedChanges.filter((change) => change.entityType === 'global')

  const resolved = await resolveEffectiveOperations({ branch, changes: pending, payload, req })

  const resolvedByChangeID = new Map(resolved.map((each) => [String(each.change.id), each]))

  // The enforcement boundary: a branch is a proposal, and this is where the
  // merging user's production permissions are actually applied.
  const blocked = overrideAccess ? [] : await runMergePreflight({ payload, pending: resolved, req })
  const blockedChangeIDs = new Set(blocked.map((each) => String(each.changeID)))

  const applicable = pending.filter((change) => !blockedChangeIDs.has(String(change.id)))

  const mergeable: MergeableChange[] = applicable.map((change) => ({
    changeID: change.id,
    collectionSlug: change.collectionSlug as string,
    docID: changeDocID(change),
    entityType: 'collection' as const,
    operation: change.operation as BranchOperation,
  }))

  const blockedGlobals = overrideAccess
    ? []
    : await runGlobalMergePreflight({ payload, pending: pendingGlobals, req })
  const blockedGlobalIDs = new Set(blockedGlobals.map((each) => String(each.changeID)))
  const applicableGlobals = pendingGlobals.filter(
    (change) => !blockedGlobalIDs.has(String(change.id)),
  )

  mergeable.push(
    ...applicableGlobals.map((change) => ({
      changeID: change.id,
      entityType: 'global' as const,
      globalSlug: change.globalSlug as string,
      operation: 'update' as const,
    })),
  )

  blocked.push(...blockedGlobals)

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

  // Both sides of every change, for the ledger. Read either side of the write
  // because that is the only moment both exist: afterwards the branch's copy is
  // gone and main holds the merged values on the one remaining row.
  const snapshots = new Map<string, { after: unknown; before: unknown }>()

  const readFromMain = async (collectionSlug: string, docID: number | string) =>
    (await payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: { and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }] },
    })) as null | Record<string, unknown>

  const readGlobalFromMain = async (globalSlug: string) =>
    (await payload.findGlobal({
      slug: globalSlug,
      branch: false,
      depth: 0,
      overrideAccess: true,
      req,
    })) as null | Record<string, unknown>

  try {
    for (const [index, change] of applicable.entries()) {
      await onProgress?.({
        collectionSlug: change.collectionSlug as string,
        current: index + 1,
        docID: changeDocID(change),
        operation: change.operation as BranchOperation,
        total: applicable.length,
      })

      const collectionSlug = change.collectionSlug as string
      const docID = changeDocID(change)
      const before = await readFromMain(collectionSlug, docID)

      await applyChange({ payload, req, resolved: resolvedByChangeID.get(String(change.id))! })

      snapshots.set(String(change.id), {
        after: await readFromMain(collectionSlug, docID),
        before,
      })

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
        entityType: 'collection',
        operation: change.operation as BranchOperation,
      })
    }

    // Globals, after the documents. Ordered that way because a global usually points at
    // documents rather than the other way round, so merging it last means whatever it
    // references is already on main.
    for (const [index, change] of applicableGlobals.entries()) {
      const globalSlug = change.globalSlug as string

      await onProgress?.({
        collectionSlug: globalSlug,
        current: applicable.length + index + 1,
        docID: globalSlug,
        operation: 'update',
        total: applicable.length + applicableGlobals.length,
      })

      const before = await readGlobalFromMain(globalSlug)

      await applyGlobalChange({ branch, globalSlug, payload, req })

      snapshots.set(String(change.id), {
        after: await readGlobalFromMain(globalSlug),
        before,
      })

      await payload.delete({
        id: change.id,
        collection: branchChangesCollectionSlug,
        overrideAccess: true,
        req,
      })

      result.merged.push({
        changeID: change.id,
        entityType: 'global',
        globalSlug,
        operation: 'update',
      })
    }

    const mergedAt = new Date().toISOString()

    // The ledger, written before the status is settled: the change rows this merge
    // consumed are gone, and their shadow rows with them, so this is the only
    // remaining record of what happened. Titles are snapshotted because a document
    // merged under one name and renamed later was merged under the old one.
    if (result.merged.length) {
      await payload.create({
        collection: branchMergesCollectionSlug,
        data: {
          branch,
          changes: result.merged.map((each) => {
            const snapshot = snapshots.get(String(each.changeID))

            if (each.entityType === 'global') {
              const globalConfig = payload.globals?.config?.find(
                (config) => config.slug === each.globalSlug,
              )

              return {
                after: snapshot?.after ?? null,
                before: snapshot?.before ?? null,
                docTitle:
                  typeof globalConfig?.label === 'string'
                    ? globalConfig.label
                    : (each.globalSlug as string),
                globalSlug: each.globalSlug,
                operation: each.operation,
              }
            }

            const shadow = resolvedByChangeID.get(String(each.changeID))?.shadow
            const useAsTitle = payload.collections[each.collectionSlug!]?.config.admin?.useAsTitle

            return {
              after: snapshot?.after ?? null,
              before: snapshot?.before ?? null,
              collectionSlug: each.collectionSlug,
              docID: String(each.docID),
              docTitle: String(
                (useAsTitle ? shadow?.[useAsTitle] : undefined) ?? shadow?.id ?? each.docID,
              ),
              operation: each.operation,
            }
          }),
          mergedAt,
          mergedByID: req.user?.id === undefined ? undefined : String(req.user.id),
          mergedByLabel: (req.user as { email?: string } | null)?.email,
        },
        overrideAccess: true,
        req,
      })
    }

    const remaining = await payload.count({
      collection: branchChangesCollectionSlug,
      overrideAccess: true,
      req,
      where: { branch: { equals: branch } },
    })

    // `merged` means "nothing left pending", not "finished forever". A partial
    // merge leaves the branch open and workable, and recording a new change on a
    // merged branch flips it back (see `reopenBranchOnChange`) — the branch is the
    // workspace, the merge is the event. `closed` is the terminal state, and only a
    // caller who asked for it gets it.
    if (remaining.totalDocs === 0) {
      await payload.update({
        id: branchDoc.id,
        collection: branchesCollectionSlug,
        data: { mergedAt, status: closeBranch ? 'closed' : 'merged' },
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

/** Branch bookkeeping and server-owned timestamps never travel to main. */
const stripInternal = (data: Record<string, unknown>): Record<string, unknown> => {
  const {
    id: _id,
    [branchDocIDField]: _docID,
    [branchField]: _branch,
    [branchOpField]: _op,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data

  return rest
}

/**
 * A branch document's data, ready to be written onto main's row.
 *
 * Array and block rows carry primary keys belonging to the branch's copy, and writing them
 * onto main's row collides with the rows the branch's copy still owns. Passing an empty
 * `existingDoc` drops every nested key so the write mints its own — which is what
 * `copyDataWithFreshRowIDs` is for, and why the bulk update path already calls it.
 */
const forMain = ({
  collectionSlug,
  data,
  payload,
}: {
  collectionSlug: string
  data: Record<string, unknown>
  payload: Payload
}): Record<string, unknown> =>
  copyDataWithFreshRowIDs({
    config: payload.config,
    data: stripInternal(data),
    existingDoc: {},
    fields: payload.collections[collectionSlug]!.config.fields,
  })

const applyChange = async ({
  payload,
  req,
  resolved,
}: {
  payload: Payload
  req: PayloadRequest
  resolved: ResolvedChange
}): Promise<void> => {
  const { change, collectionSlug, docID, shadow, writes } = resolved

  if (!shadow) {
    return
  }

  const shadowID = shadow.id as number | string
  const branch = change.branch as string

  // The chain goes with the row. It hangs off the shadow row's primary key rather
  // than the canonical ID, so nothing addressing the document cascades to it, and a
  // chain left behind keeps the merged document in the branch's drafts list a second
  // time alongside main's copy.
  const dropVersionChain = () =>
    deleteBranchVersionChain({ branch, collectionSlug, payload, req, rowID: shadowID })

  const dropShadowRow = async () => {
    await dropVersionChain()

    await payload.db.deleteOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: { id: { equals: shadowID } },
    })
  }

  if (change.operation === 'delete') {
    await payload.delete({
      id: docID,
      branch: false,
      collection: collectionSlug,
      overrideAccess: true,
      req,
    })

    await dropShadowRow()

    return
  }

  // A fork that was never edited afterwards. Nothing happened to the document on
  // this branch, so writing main would only bump `updatedAt` and re-run hooks for
  // a no-op — the shadow row is simply discarded.
  if (!writes.length) {
    await dropShadowRow()

    return
  }

  if (change.operation === 'create') {
    const [rowWrite, ...laterWrites] = writes

    // Before the promotion, not after: the write below records main's first version
    // for this row, and clearing the chain afterwards could take it with it — which
    // would drop a published document out of main's own drafts list.
    await dropVersionChain()

    // Updated in place rather than recreated. The row already holds the ID that
    // inbound relationships point at, and deleting it would cascade those
    // relationship rows away — rebuilding the row does not bring them back.
    // `operation: 'create'` still reports it as a create, because from main's
    // point of view the document is new.
    await updateByIDOperation({
      id: shadowID,
      collection: payload.collections[collectionSlug]!,
      data: {
        ...stripInternal(rowWrite!.data),
        [branchField]: MAIN_BRANCH,
        [branchOpField]: null,
      } as never,
      operation: 'create',
      overrideAccess: true,
      req,
    })

    // The branch left a draft above what it published. Applied as its own write so
    // main passes through both states it genuinely went through.
    for (const write of laterWrites) {
      await payload.update({
        id: shadowID,
        branch: false,
        collection: collectionSlug,
        data: stripInternal(write.data) as never,
        draft: true,
        overrideAccess: true,
        req,
      })
    }

    return
  }

  const localization = payload.config.localization
  const localeCodes = localization ? localization.localeCodes : undefined

  for (const write of writes) {
    // With localization off there is one value per field, so the shadow row is the write.
    if (!localeCodes?.length) {
      await payload.update({
        id: docID,
        branch: false,
        collection: collectionSlug,
        data: forMain({ collectionSlug, data: write.data, payload }) as never,
        // A draft-only branch edit must stay a draft on main: main's published row
        // is not what the branch changed, and publishing it would push work the
        // author never published live.
        draft: write.draft,
        overrideAccess: true,
        req,
      })

      continue
    }

    // One write per locale, each reading the branch's document *in* that locale.
    //
    // The shadow row cannot be written directly here. A raw row holds every locale at
    // once, in a shape that differs by adapter, and Payload has no write that takes all
    // locales together — so passing it through resolved a single locale and silently
    // dropped the branch's edits to every other one. Reading per locale through the Local
    // API is the same thing a person editing main by hand would do.
    for (const locale of localeCodes) {
      const branchDoc = await payload.findByID({
        id: docID,
        branch,
        collection: collectionSlug,
        depth: 0,
        disableErrors: true,
        draft: write.draft,
        locale,
        overrideAccess: true,
        req: onBranch(req, branch),
      })

      if (!branchDoc) {
        continue
      }

      await payload.update({
        id: docID,
        branch: false,
        collection: collectionSlug,
        data: forMain({
          collectionSlug,
          data: branchDoc as Record<string, unknown>,
          payload,
        }) as never,
        draft: write.draft,
        locale,
        overrideAccess: true,
        req,
      })
    }
  }

  await dropShadowRow()
}

/**
 * A copy of the merge's request that can read the branch it is merging.
 *
 * The merge engine's own request has branch resolution switched off, which is what makes
 * its writes land on main. Reading the branch's side of a change needs the opposite, and
 * needs it without disturbing the request doing the writing.
 */
const onBranch = (req: PayloadRequest, branch: string): PayloadRequest => {
  const isolated = isolateBranchState(req)

  isolated.branch = branch
  ;(isolated.context as Record<string, unknown>)._branchBypass = false

  return isolated
}

/**
 * Applies a branch's copy of a global to main, then drops the copy.
 *
 * The copy is the change — there is no operation to resolve and nothing to tombstone — so
 * this is a read of the branch's row, a write of main's, and a delete. Dropping the copy
 * is what makes the branch read through to main again; leaving it would shadow main for
 * good, so a later edit on main would be invisible on a branch that had already merged.
 */
const applyGlobalChange = async ({
  branch,
  globalSlug,
  payload,
  req,
}: {
  branch: string
  globalSlug: string
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  const branchGlobal = (await payload.findGlobal({
    slug: globalSlug,
    branch,
    depth: 0,
    overrideAccess: true,
    req,
  })) as Record<string, unknown>

  await payload.updateGlobal({
    slug: globalSlug,
    branch: false,
    data: stripInternal({ ...branchGlobal, globalType: undefined }) as never,
    overrideAccess: true,
    req,
  })

  if (!payload.db.deleteBranchGlobal) {
    throw new Error(
      `The database adapter cannot remove a branch's copy of a global, so "${globalSlug}" cannot be merged.`,
    )
  }

  await payload.db.deleteBranchGlobal({ branch, globalSlug, req })
}

export const getBranchesLocalAPI = (payload: Payload) => ({
  discard: (options: DiscardOptions) => discardBranchChanges(payload, options),
  merge: (options: MergeOptions) => mergeBranch(payload, options),
})
