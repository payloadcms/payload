import type { ArrayField, BlocksField, Field } from '../fields/config/types.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { DiscardOptions } from './discard.js'
import type { ResolvedChange } from './effectiveOperations.js'
import type { BlockedChange } from './preflight.js'
import type { BranchOperation } from './types.js'

import {
  type BranchMergeUploadDataContext,
  branchMergeUploadDataContextKey,
  updateByIDOperationForBranchMerge,
} from '../collections/operations/updateByID.js'
import { copyDataWithFreshRowIDs } from '../collections/operations/utilities/copyDataWithFreshRowIDs.js'
import { APIError, Forbidden } from '../errors/index.js'
import { tabHasName } from '../fields/config/types.js'
import { throwOnFieldAccessDeniedContextKey } from '../fields/hooks/beforeValidate/throwOnAccessDenied.js'
import { deleteUploadFilesExclusiveToDocument } from '../uploads/deleteUploadFilesExclusiveToDocument.js'
import { commitTransaction } from '../utilities/commitTransaction.js'
import { createPayloadRequest } from '../utilities/createPayloadRequest.js'
import { getVersionsMax } from '../utilities/getVersionsConfig.js'
import { initTransaction } from '../utilities/initTransaction.js'
import { killTransaction } from '../utilities/killTransaction.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScopeAfterOperation,
} from '../utilities/transactionCallbacks.js'
import { traverseForLocalizedFields } from '../utilities/traverseForLocalizedFields.js'
import {
  enforceMaxVersions,
  skipEnforceMaxVersionsContextKey,
} from '../versions/enforceMaxVersions.js'
import { discardBranchChanges } from './discard.js'
import { resolveEffectiveOperations } from './effectiveOperations.js'
import {
  getGlobalMergeLocales,
  readBranchGlobalWrite,
  resolveGlobalMergeWrites,
} from './globalMergeWrites.js'
import { type BranchMergeWriteGuard, branchMergeWriteGuardContextKey } from './mergeWriteGuard.js'
import {
  hasUnavailableBranchCreatedDependency,
  resolveMergeDependencies,
  runGlobalMergePreflight,
  runMergeDependencyPreflight,
  runMergePreflight,
} from './preflight.js'
import { readLocalizedBranchWrite } from './readLocalizedBranchWrite.js'
import { readCollectionMergeSnapshot, readGlobalMergeSnapshot } from './readMergeSnapshot.js'
import { isolateBranchState, refreshBranchState, withoutBranch } from './resolveBranch.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchesCollectionSlug,
  branchField,
  branchMergesCollectionSlug,
  branchParentField,
  MAIN_BRANCH,
} from './types.js'
import { deleteBranchGlobalVersionChain, deleteBranchVersionChain } from './versions.js'

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
  /** Changes that cannot be applied because of access or an unavailable dependency. */
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
  onProgress?: (progress: MergeProgress, req: PayloadRequest) => Promise<void> | void
  /**
   * Skip the per-document permission checks.
   *
   * HTTP callers must pass `false` together with `user`: branch writes are
   * deliberately permissive on the assumption that nothing is real until
   * merge.
   *
   * @default false
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

const orderChangesByDependencies = <TChange extends { id: unknown }>({
  changes,
  dependencyChangeIDsByChangeID,
}: {
  changes: TChange[]
  dependencyChangeIDsByChangeID: Map<string, Set<string>>
}): TChange[] => {
  const changesByID = new Map(changes.map((change) => [String(change.id), change]))
  const orderedChanges: TChange[] = []
  const orderedChangeIDs = new Set<string>()
  const visitingChangeIDs = new Set<string>()

  const visitChange = (change: TChange): void => {
    const changeID = String(change.id)

    if (orderedChangeIDs.has(changeID) || visitingChangeIDs.has(changeID)) {
      return
    }

    visitingChangeIDs.add(changeID)

    for (const dependencyChangeID of dependencyChangeIDsByChangeID.get(changeID) ?? []) {
      const dependencyChange = changesByID.get(dependencyChangeID)

      if (dependencyChange) {
        visitChange(dependencyChange)
      }
    }

    visitingChangeIDs.delete(changeID)
    orderedChangeIDs.add(changeID)
    orderedChanges.push(change)
  }

  for (const change of changes) {
    visitChange(change)
  }

  return orderedChanges
}

const getSnapshotDocumentTitle = ({
  after,
  docID,
  useAsTitle,
}: {
  after: null | Record<string, unknown> | undefined
  docID: number | string
  useAsTitle: string | undefined
}): string => {
  const title = useAsTitle ? after?.[useAsTitle] : undefined

  return typeof title === 'number' || typeof title === 'string' ? String(title) : String(docID)
}

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
    overrideAccess = false,
    req: incomingReq,
    user,
  }: MergeOptions,
): Promise<MergeResult> => {
  // `branch: false` throughout: merge addresses shadow rows by their real
  // primary key and writes to main, so it must not be branch-filtered itself.
  const req = incomingReq
    ? withoutBranch(incomingReq)
    : await createPayloadRequest({ branch: false, payload, user })

  if (user && !req.user) {
    req.user = user
  }

  const branchDocs = await payload.find({
    collection: branchesCollectionSlug,
    limit: 1,
    overrideAccess,
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

  // This first pass describes which changes the user can select. Each selected
  // change is checked again inside the transaction immediately before its real
  // write, because hooks can change access-relevant state after this point.
  const blocked = overrideAccess ? [] : await runMergePreflight({ payload, pending: resolved, req })
  const blockedGlobals = overrideAccess
    ? []
    : await runGlobalMergePreflight({ payload, pending: pendingGlobals, req })
  blocked.push(...blockedGlobals)

  blocked.push(
    ...(await runMergeDependencyPreflight({
      initiallyBlocked: blocked,
      payload,
      pending: resolved,
      pendingGlobals,
      req,
    })),
  )

  const blockedChangeIDs = new Set(blocked.map((each) => String(each.changeID)))
  const applicable = pending.filter((change) => !blockedChangeIDs.has(String(change.id)))
  const applicableGlobals = pendingGlobals.filter(
    (change) => !blockedChangeIDs.has(String(change.id)),
  )

  const mergeable: MergeableChange[] = applicable.map((change) => ({
    changeID: change.id,
    collectionSlug: change.collectionSlug as string,
    docID: changeDocID(change),
    entityType: 'collection' as const,
    operation: change.operation as BranchOperation,
  }))

  mergeable.push(
    ...applicableGlobals.map((change) => ({
      changeID: change.id,
      entityType: 'global' as const,
      globalSlug: change.globalSlug as string,
      operation: 'update' as const,
    })),
  )

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

  // Gated on `req.transactionID`, not on whether a `req` was passed in: a merge
  // triggered over HTTP hands in a `req` of its own that has no transaction on
  // it yet, and it must get one just as much as a Local API call would.
  const shouldCommit = await initTransaction(req)
  const transactionID = req.transactionID ? await req.transactionID : undefined
  const hasTransaction = transactionID !== null && transactionID !== undefined
  const cleanupScope = await beginDeferredCleanupScope({ req })

  // Both sides of every change, for the ledger. Read either side of the write
  // because that is the only moment both exist: afterwards the branch's copy is
  // gone and main holds the merged values on the one remaining row.
  const snapshots = new Map<string, { after: unknown; before: unknown }>()
  const uploadCleanupPlans: {
    collectionSlug: string
    retainedDoc: null | Record<string, unknown>
    sourceDoc: Record<string, unknown>
  }[] = []
  const reqContext = req.context as Record<PropertyKey, unknown>
  const previousBranchMergeWriteGuard = reqContext[branchMergeWriteGuardContextKey]
  const previousThrowOnFieldAccessDenied = reqContext[throwOnFieldAccessDeniedContextKey]

  reqContext[branchMergeWriteGuardContextKey] = (async ({
    collectionSlug,
    data,
    globalSlug,
    req: writeReq,
  }) => {
    if (
      await hasUnavailableBranchCreatedDependency({
        collectionSlug,
        data,
        globalSlug,
        payload,
        req: writeReq,
      })
    ) {
      throw new APIError(
        'This change refers to branch-created content that will not be available on main.',
        409,
      )
    }
  }) satisfies BranchMergeWriteGuard

  if (!overrideAccess) {
    reqContext[throwOnFieldAccessDeniedContextKey] = true
  }

  try {
    const refreshedApplicable = await resolveEffectiveOperations({
      branch,
      changes: applicable,
      payload,
      req,
    })
    const dependencyPlan = await resolveMergeDependencies({
      initiallyBlocked: [],
      payload,
      pending: refreshedApplicable,
      pendingGlobals: applicableGlobals,
      req,
    })

    if (dependencyPlan.blocked.length) {
      throw new APIError(dependencyPlan.blocked[0]!.message, 409)
    }

    const applicableInWriteOrder = orderChangesByDependencies({
      changes: applicable,
      dependencyChangeIDsByChangeID: dependencyPlan.dependencyChangeIDsByChangeID,
    })

    for (const [index, change] of applicableInWriteOrder.entries()) {
      await onProgress?.(
        {
          collectionSlug: change.collectionSlug as string,
          current: index + 1,
          docID: changeDocID(change),
          operation: change.operation as BranchOperation,
          total: applicableInWriteOrder.length,
        },
        req,
      )

      const [resolvedChange] = await resolveEffectiveOperations({
        branch,
        changes: [change],
        payload,
        req,
      })

      if (!resolvedChange) {
        throw new Error(`Branch change ${String(change.id)} could not be resolved.`)
      }

      if (!overrideAccess) {
        const blockedAtUse = await runMergePreflight({
          payload,
          pending: [resolvedChange],
          req,
        })

        if (blockedAtUse.length) {
          throw new Forbidden(req.t)
        }
      }

      const collectionSlug = change.collectionSlug as string
      const docID = changeDocID(change)
      const collectionConfig = payload.collections[collectionSlug]!.config
      const before =
        change.operation === 'create'
          ? null
          : await readCollectionMergeSnapshot({ collectionSlug, docID, payload, req })
      const uploadSourceDoc =
        change.operation === 'update' && collectionConfig.upload
          ? ((await payload.db.findOne({
              branch: false,
              collection: collectionSlug,
              req,
              where: {
                and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
              },
            })) as null | Record<string, unknown>)
          : null

      const dependencyBlockedAtUse = await runMergeDependencyPreflight({
        initiallyBlocked: [],
        payload,
        pending: [resolvedChange],
        pendingGlobals: [],
        req,
      })

      if (dependencyBlockedAtUse.length) {
        throw new APIError(dependencyBlockedAtUse[0]!.message, 409)
      }

      await applyChange({
        hasTransaction,
        overrideAccess,
        payload,
        req,
        resolved: resolvedChange,
      })

      if (uploadSourceDoc) {
        const retainedDoc = (await payload.db.findOne({
          branch: false,
          collection: collectionSlug,
          req,
          where: {
            and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
          },
        })) as null | Record<string, unknown>

        uploadCleanupPlans.push({ collectionSlug, retainedDoc, sourceDoc: uploadSourceDoc })
      }

      snapshots.set(String(change.id), {
        after: await readCollectionMergeSnapshot({ collectionSlug, docID, payload, req }),
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

      await onProgress?.(
        {
          collectionSlug: globalSlug,
          current: applicableInWriteOrder.length + index + 1,
          docID: globalSlug,
          operation: 'update',
          total: applicableInWriteOrder.length + applicableGlobals.length,
        },
        req,
      )

      if (!overrideAccess) {
        const blockedAtUse = await runGlobalMergePreflight({ payload, pending: [change], req })

        if (blockedAtUse.length) {
          throw new Forbidden(req.t)
        }
      }

      const before = await readGlobalMergeSnapshot({ globalSlug, payload, req })

      const dependencyBlockedAtUse = await runMergeDependencyPreflight({
        initiallyBlocked: [],
        payload,
        pending: [],
        pendingGlobals: [change],
        req,
      })

      if (dependencyBlockedAtUse.length) {
        throw new APIError(dependencyBlockedAtUse[0]!.message, 409)
      }

      await applyGlobalChange({ branch, globalSlug, overrideAccess, payload, req })

      snapshots.set(String(change.id), {
        after: await readGlobalMergeSnapshot({ globalSlug, payload, req }),
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

            const useAsTitle = payload.collections[each.collectionSlug!]?.config.admin?.useAsTitle
            const after = snapshot?.after as null | Record<string, unknown> | undefined

            return {
              after: snapshot?.after ?? null,
              before: snapshot?.before ?? null,
              collectionSlug: each.collectionSlug,
              docID: String(each.docID),
              docTitle: getSnapshotDocumentTitle({ after, docID: each.docID!, useAsTitle }),
              operation: each.operation,
            }
          }),
          mergedAt,
          mergedByCollection: req.user?.collection,
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

    for (const { collectionSlug, retainedDoc, sourceDoc } of uploadCleanupPlans) {
      await deleteUploadFilesExclusiveToDocument({
        collectionConfig: payload.collections[collectionSlug]!.config,
        config: payload.config,
        req,
        retainedDoc,
        sourceDoc,
      })
    }

    if (cleanupScope) {
      await flushDeferredCleanupScopeAfterOperation({ req, scope: cleanupScope })
    }

    if (shouldCommit) {
      await commitTransaction(req)
    }
  } catch (error) {
    if (cleanupScope) {
      clearDeferredCleanupScope({ req, scope: cleanupScope })
    }

    if (shouldCommit) {
      await killTransaction(req)
    }
    throw error
  } finally {
    if (previousBranchMergeWriteGuard === undefined) {
      delete reqContext[branchMergeWriteGuardContextKey]
    } else {
      reqContext[branchMergeWriteGuardContextKey] = previousBranchMergeWriteGuard
    }

    if (!overrideAccess) {
      if (previousThrowOnFieldAccessDenied === undefined) {
        delete reqContext[throwOnFieldAccessDeniedContextKey]
      } else {
        reqContext[throwOnFieldAccessDeniedContextKey] = previousThrowOnFieldAccessDenied
      }
    }

    if (incomingReq) {
      refreshBranchState(incomingReq)
    }
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

type NestedRowIDMap = Map<ArrayField | BlocksField, Map<string, number | string>>

/**
 * Reuses IDs that main minted for the same source branch rows during an earlier write.
 * The field key scopes row IDs to the nested table that owns them.
 */
const applyMappedNestedRowIDs = ({
  data,
  fields,
  mainRowIDsBySource,
  payload,
  sourceData,
}: {
  data: Record<string, unknown>
  fields: Field[]
  mainRowIDsBySource: NestedRowIDMap
  payload: Payload
  sourceData: Record<string, unknown>
}): Record<string, unknown> => {
  visitNestedRows({
    data,
    fields,
    payload,
    sourceData,
    visitRow: ({ field, row, sourceRow }) => {
      const sourceRowID = sourceRow.id

      if (typeof sourceRowID !== 'string' && typeof sourceRowID !== 'number') {
        return
      }

      const mappedRowID = mainRowIDsBySource.get(field)?.get(String(sourceRowID))

      if (mappedRowID !== undefined) {
        row.id = mappedRowID
      }
    },
  })

  return data
}

/** Records the main ID for each source branch row after a write succeeds. */
const recordNestedRowIDs = ({
  fields,
  mainRowIDsBySource,
  mergedData,
  payload,
  sourceData,
}: {
  fields: Field[]
  mainRowIDsBySource: NestedRowIDMap
  mergedData: Record<string, unknown>
  payload: Payload
  sourceData: Record<string, unknown>
}): void => {
  visitNestedRows({
    data: mergedData,
    fields,
    payload,
    sourceData,
    visitRow: ({ field, row, sourceRow }) => {
      const mergedRowID = row.id
      const sourceRowID = sourceRow.id

      if (
        (typeof mergedRowID !== 'string' && typeof mergedRowID !== 'number') ||
        (typeof sourceRowID !== 'string' && typeof sourceRowID !== 'number')
      ) {
        return
      }

      let fieldRowIDs = mainRowIDsBySource.get(field)

      if (!fieldRowIDs) {
        fieldRowIDs = new Map()
        mainRowIDsBySource.set(field, fieldRowIDs)
      }

      fieldRowIDs.set(String(sourceRowID), mergedRowID)
    },
  })
}

const visitNestedRows = ({
  data,
  fields,
  payload,
  sourceData,
  visitRow,
}: {
  data: Record<string, unknown>
  fields: Field[]
  payload: Payload
  sourceData: Record<string, unknown>
  visitRow: (args: {
    field: ArrayField | BlocksField
    row: Record<string, unknown>
    sourceRow: Record<string, unknown>
  }) => void
}): void => {
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible') {
      visitNestedRows({ data, fields: field.fields, payload, sourceData, visitRow })
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (!tabHasName(tab)) {
          visitNestedRows({ data, fields: tab.fields, payload, sourceData, visitRow })
          continue
        }

        const nestedData = data[tab.name]
        const nestedSourceData = sourceData[tab.name]

        if (
          nestedData &&
          typeof nestedData === 'object' &&
          !Array.isArray(nestedData) &&
          nestedSourceData &&
          typeof nestedSourceData === 'object' &&
          !Array.isArray(nestedSourceData)
        ) {
          visitNestedRows({
            data: nestedData as Record<string, unknown>,
            fields: tab.fields,
            payload,
            sourceData: nestedSourceData as Record<string, unknown>,
            visitRow,
          })
        }
      }

      continue
    }

    if (field.type === 'group') {
      if (!('name' in field) || !field.name) {
        visitNestedRows({ data, fields: field.fields, payload, sourceData, visitRow })
        continue
      }

      const nestedData = data[field.name]
      const nestedSourceData = sourceData[field.name]

      if (
        nestedData &&
        typeof nestedData === 'object' &&
        !Array.isArray(nestedData) &&
        nestedSourceData &&
        typeof nestedSourceData === 'object' &&
        !Array.isArray(nestedSourceData)
      ) {
        visitNestedRows({
          data: nestedData as Record<string, unknown>,
          fields: field.fields,
          payload,
          sourceData: nestedSourceData as Record<string, unknown>,
          visitRow,
        })
      }

      continue
    }

    if ((field.type !== 'array' && field.type !== 'blocks') || !field.name) {
      continue
    }

    const rows = data[field.name]
    const sourceRows = sourceData[field.name]

    if (!Array.isArray(rows) || !Array.isArray(sourceRows)) {
      continue
    }

    for (const [index, row] of rows.entries()) {
      const sourceRow = sourceRows[index]

      if (
        !row ||
        typeof row !== 'object' ||
        Array.isArray(row) ||
        !sourceRow ||
        typeof sourceRow !== 'object' ||
        Array.isArray(sourceRow)
      ) {
        continue
      }

      const rowData = row as Record<string, unknown>
      const sourceRowData = sourceRow as Record<string, unknown>

      visitRow({ field, row: rowData, sourceRow: sourceRowData })

      const nestedFields =
        field.type === 'array'
          ? field.fields
          : resolveBlockFields({
              field,
              payload,
              row: rowData,
            })

      visitNestedRows({
        data: rowData,
        fields: nestedFields,
        payload,
        sourceData: sourceRowData,
        visitRow,
      })
    }
  }
}

const resolveBlockFields = ({
  field,
  payload,
  row,
}: {
  field: BlocksField
  payload: Payload
  row: Record<string, unknown>
}): Field[] => {
  const blockType = row.blockType

  if (typeof blockType !== 'string') {
    return []
  }

  const block =
    payload.config.blocks?.find(({ slug }) => slug === blockType) ??
    field.blocks.find((candidate) => typeof candidate !== 'string' && candidate.slug === blockType)

  return typeof block === 'string' || !block ? [] : block.fields
}

const applyChange = async ({
  hasTransaction,
  overrideAccess,
  payload,
  req,
  resolved,
}: {
  hasTransaction: boolean
  overrideAccess: boolean
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
  const mainWriteReq = withoutBranch(req)

  mainWriteReq.file = undefined
  mainWriteReq.payloadUploadSizes = undefined
  mainWriteReq.query = { ...mainWriteReq.query }
  delete mainWriteReq.query.uploadEdits
  delete (mainWriteReq.context as Record<string, unknown>)._payloadCloudStorage

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

  const updateMainDocument = async ({
    id,
    data,
    draft,
    locale,
  }: {
    data: Record<string, unknown>
    draft: boolean
    id: number | string
    locale?: string
  }): Promise<Record<string, unknown>> => {
    const reqContext = mainWriteReq.context as Record<PropertyKey, unknown>
    const previousBranchMergeUploadData = reqContext[branchMergeUploadDataContextKey]
    const branchMergeUploadData: BranchMergeUploadDataContext = {
      id,
      collectionSlug,
      data,
    }

    reqContext[branchMergeUploadDataContextKey] = branchMergeUploadData

    try {
      return (await payload.update({
        id,
        branch: false,
        collection: collectionSlug,
        data: data as never,
        draft,
        locale,
        overrideAccess,
        req: mainWriteReq,
      })) as Record<string, unknown>
    } finally {
      if (previousBranchMergeUploadData === undefined) {
        delete reqContext[branchMergeUploadDataContextKey]
      } else {
        reqContext[branchMergeUploadDataContextKey] = previousBranchMergeUploadData
      }
    }
  }

  if (change.operation === 'delete') {
    await payload.delete({
      id: docID,
      branch: false,
      collection: collectionSlug,
      overrideAccess,
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
    const createReq = mainWriteReq

    const localization = payload.config.localization
    const hasLocalizedFields = traverseForLocalizedFields(
      payload.collections[collectionSlug]!.config.fields,
    )
    const localeCodes = localization && hasLocalizedFields ? localization.localeCodes : undefined
    let localizedWrites: Map<string, Record<string, unknown>>[] | undefined

    if (localeCodes?.length) {
      localizedWrites = []

      for (const write of writes) {
        const documentsByLocale = new Map<string, Record<string, unknown>>()

        for (const locale of localeCodes) {
          const branchDoc = await readLocalizedBranchWrite({
            branch,
            collectionSlug,
            docID,
            draft: write.draft,
            locale,
            payload,
            req: createReq,
          })

          if (branchDoc) {
            documentsByLocale.set(locale, branchDoc)
          }
        }

        localizedWrites.push(documentsByLocale)
      }
    }

    const applyCreateWrites = async () => {
      // Updated in place rather than recreated. The row already holds the ID that
      // inbound relationships point at, and deleting it would cascade those
      // relationship rows away — rebuilding the row does not bring them back.
      // The branch-merge operation still reports it as a create, because from
      // main's point of view the document is new.
      if (localeCodes?.length) {
        const defaultLocale = localization && localization.defaultLocale
        const createLocale =
          defaultLocale && localeCodes.includes(defaultLocale) ? defaultLocale : localeCodes[0]!
        const branchDoc = localizedWrites?.[0]?.get(createLocale)

        if (branchDoc) {
          await updateByIDOperationForBranchMerge({
            id: shadowID,
            collection: payload.collections[collectionSlug]!,
            data: stripInternal(branchDoc) as never,
            draft: rowWrite!.draft,
            overrideAccess,
            req: withLocale({ locale: createLocale, req: createReq }),
          })
        }
      } else {
        await updateByIDOperationForBranchMerge({
          id: shadowID,
          collection: payload.collections[collectionSlug]!,
          data: stripInternal(rowWrite!.data) as never,
          overrideAccess,
          req: createReq,
        })
      }

      // The branch left a draft above what it published. Applied as its own write so
      // main passes through both states it genuinely went through.
      for (const [writeIndex, write] of laterWrites.entries()) {
        if (localeCodes?.length) {
          for (const locale of localeCodes) {
            const branchDoc = localizedWrites?.[writeIndex + 1]?.get(locale)

            if (!branchDoc) {
              continue
            }

            await updateMainDocument({
              id: shadowID,
              data: stripInternal(branchDoc) as never,
              draft: true,
              locale,
            })
          }
        } else {
          await updateMainDocument({
            id: shadowID,
            data: stripInternal(write.data) as never,
            draft: true,
          })
        }
      }
    }

    if (hasTransaction) {
      // Before the promotion, not after: the write below records main's first version
      // for this row, and clearing the chain afterwards could take it with it — which
      // would drop a published document out of main's own drafts list.
      await dropVersionChain()

      await payload.db.updateOne({
        id: shadowID,
        branch: false,
        collection: collectionSlug,
        data: { [branchField]: MAIN_BRANCH },
        req: createReq,
      })

      await applyCreateWrites()

      return
    }

    await applyBranchCreateWithoutTransaction({
      applyCreateWrites,
      branch,
      collectionSlug,
      payload,
      req: createReq,
      shadow,
      shadowID,
    })

    return
  }

  const localization = payload.config.localization
  const localeCodes = localization ? localization.localeCodes : undefined
  const fields = payload.collections[collectionSlug]!.config.fields
  const mainRowIDsBySource: NestedRowIDMap = new Map()

  for (const write of writes) {
    // With localization off there is one value per field, so the shadow row is the write.
    if (!localeCodes?.length) {
      const data = applyMappedNestedRowIDs({
        data: forMain({ collectionSlug, data: write.data, payload }),
        fields,
        mainRowIDsBySource,
        payload,
        sourceData: write.data,
      })

      const mergedData = await updateMainDocument({
        id: docID,
        data,
        // A draft-only branch edit must stay a draft on main: main's published row
        // is not what the branch changed, and publishing it would push work the
        // author never published live.
        draft: write.draft,
      })

      recordNestedRowIDs({
        fields,
        mainRowIDsBySource,
        mergedData,
        payload,
        sourceData: write.data,
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
      const branchDoc = await readLocalizedBranchWrite({
        branch,
        collectionSlug,
        docID,
        draft: write.draft,
        locale,
        payload,
        req,
      })

      if (!branchDoc) {
        continue
      }

      const data = applyMappedNestedRowIDs({
        data: forMain({
          collectionSlug,
          data: branchDoc,
          payload,
        }),
        fields,
        mainRowIDsBySource,
        payload,
        sourceData: branchDoc,
      })

      const mergedData = await updateMainDocument({
        id: docID,
        data,
        draft: write.draft,
        locale,
      })

      recordNestedRowIDs({
        fields,
        mainRowIDsBySource,
        mergedData,
        payload,
        sourceData: branchDoc,
      })
    }
  }

  await dropShadowRow()
}

const withLocale = ({ locale, req }: { locale: string; req: PayloadRequest }): PayloadRequest => {
  const isolated = isolateBranchState(req)

  isolated.locale = locale

  return isolated
}

type RawCollectionVersion = {
  id: number | string
  latest?: boolean
  version?: Record<string, unknown>
} & Record<string, unknown>

const applyBranchCreateWithoutTransaction = async ({
  applyCreateWrites,
  branch,
  collectionSlug,
  payload,
  req,
  shadow,
  shadowID,
}: {
  applyCreateWrites: () => Promise<void>
  branch: string
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  shadow: Record<string, unknown>
  shadowID: number | string
}): Promise<void> => {
  const existingVersions = await readRawDocumentVersions({
    collectionSlug,
    docID: shadowID,
    payload,
    req,
  })
  const existingVersionIDs = new Set(existingVersions.map(({ id }) => String(id)))
  const existingLatestVersions = existingVersions.filter(({ latest }) => latest === true)
  let preparedVersions: RawCollectionVersion[] = []
  const reqContext = req.context as Record<PropertyKey, unknown>
  const previousSkipEnforceMaxVersions = reqContext[skipEnforceMaxVersionsContextKey]

  try {
    for (const version of existingLatestVersions) {
      await setVersionLatest({ collectionSlug, isLatest: false, payload, req, version })
    }

    // The row keeps its branch identity while project access, hooks and validation
    // run. A rejected write therefore cannot become visible on main when the
    // adapter has no transaction support.
    reqContext[skipEnforceMaxVersionsContextKey] = { id: shadowID, collectionSlug }

    try {
      await applyCreateWrites()
    } finally {
      if (previousSkipEnforceMaxVersions === undefined) {
        delete reqContext[skipEnforceMaxVersionsContextKey]
      } else {
        reqContext[skipEnforceMaxVersionsContextKey] = previousSkipEnforceMaxVersions
      }
    }

    const versionsAfterWrite = await readRawDocumentVersions({
      collectionSlug,
      docID: shadowID,
      payload,
      req,
    })

    preparedVersions = versionsAfterWrite.filter(({ id }) => !existingVersionIDs.has(String(id)))

    for (const version of preparedVersions) {
      await promotePreparedVersion({ collectionSlug, payload, req, version })
    }

    // The document promotion is the final visibility change. Every operation that
    // can reject user data has completed before this trusted adapter write.
    await payload.db.updateOne({
      id: shadowID,
      branch: false,
      collection: collectionSlug,
      data: { [branchField]: MAIN_BRANCH },
      req,
    })

    await deleteVersionsByID({
      collectionSlug,
      ids: [...existingVersionIDs],
      payload,
      req,
    })

    const collection = payload.collections[collectionSlug]!.config
    const maxVersions = getVersionsMax(collection)

    if (maxVersions > 0) {
      await enforceMaxVersions({
        id: shadowID,
        collection,
        max: maxVersions,
        payload,
        req,
      })
    }
  } catch (error) {
    await restoreBranchCreatedShadow({
      branch,
      collectionSlug,
      payload,
      req,
      shadow,
      shadowID,
    })

    const versionsAfterFailure = await readRawDocumentVersions({
      collectionSlug,
      docID: shadowID,
      payload,
      req,
    })

    preparedVersions = versionsAfterFailure.filter(({ id }) => !existingVersionIDs.has(String(id)))

    await deleteVersionsByID({
      collectionSlug,
      ids: preparedVersions.map(({ id }) => id),
      payload,
      req,
    })

    for (const originalVersion of existingVersions) {
      await setVersionLatest({
        collectionSlug,
        isLatest: originalVersion.latest === true,
        payload,
        req,
        version: originalVersion,
      })
    }

    throw error
  }
}

const readRawDocumentVersions = async ({
  collectionSlug,
  docID,
  payload,
  req,
}: {
  collectionSlug: string
  docID: number | string
  payload: Payload
  req: PayloadRequest
}): Promise<RawCollectionVersion[]> => {
  if (!payload.collections[collectionSlug]?.config.versions) {
    return []
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: collectionSlug,
    limit: 0,
    pagination: false,
    req,
    where: { parent: { equals: docID } },
  })

  return docs as RawCollectionVersion[]
}

const setVersionLatest = async ({
  collectionSlug,
  isLatest,
  payload,
  req,
  version,
}: {
  collectionSlug: string
  isLatest: boolean
  payload: Payload
  req: PayloadRequest
  version: RawCollectionVersion
}): Promise<void> => {
  await payload.db.updateVersion({
    id: version.id,
    collection: collectionSlug,
    req,
    versionData: {
      latest: isLatest,
      version: version.version ?? {},
    },
  })
}

const promotePreparedVersion = async ({
  collectionSlug,
  payload,
  req,
  version,
}: {
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  version: RawCollectionVersion
}): Promise<void> => {
  const documentVersion =
    version.version && typeof version.version === 'object' ? version.version : {}

  await payload.db.updateVersion({
    id: version.id,
    collection: collectionSlug,
    req,
    versionData: {
      [branchField]: MAIN_BRANCH,
      [branchParentField]: null,
      version: {
        ...documentVersion,
        [branchField]: MAIN_BRANCH,
      },
    } as never,
  })
}

const deleteVersionsByID = async ({
  collectionSlug,
  ids,
  payload,
  req,
}: {
  collectionSlug: string
  ids: (number | string)[]
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  if (!ids.length) {
    return
  }

  await payload.db.deleteVersions({
    collection: collectionSlug,
    req,
    where: { id: { in: ids } },
  })
}

const restoreBranchCreatedShadow = async ({
  branch,
  collectionSlug,
  payload,
  req,
  shadow,
  shadowID,
}: {
  branch: string
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  shadow: Record<string, unknown>
  shadowID: number | string
}): Promise<void> => {
  const { id: _id, ...originalData } = shadow

  await payload.db.updateOne({
    id: shadowID,
    branch: false,
    collection: collectionSlug,
    data: {
      ...originalData,
      [branchField]: branch,
    },
    req,
  })
}

/** Applies every stored state of a branch global to main in published-then-draft order. */
const applyGlobalChange = async ({
  branch,
  globalSlug,
  overrideAccess,
  payload,
  req,
}: {
  branch: string
  globalSlug: string
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })

  if (!writes.length) {
    throw new Error(`Branch "${branch}" has no stored copy of global "${globalSlug}" to merge.`)
  }

  const locales = getGlobalMergeLocales({ globalSlug, payload, req })

  for (const write of writes) {
    for (const locale of locales) {
      const data = await readBranchGlobalWrite({
        branch,
        draft: write.draft,
        globalSlug,
        locale,
        payload,
        req,
      })

      if (!data) {
        throw new Error(
          `Branch "${branch}" has no stored ${write.draft ? 'draft' : 'published'} state of global "${globalSlug}" to merge.`,
        )
      }

      await payload.updateGlobal({
        slug: globalSlug,
        branch: false,
        data: stripInternal({ ...data, globalType: undefined }) as never,
        draft: write.draft,
        locale,
        overrideAccess,
        req: withLocale({ locale, req }),
      })
    }
  }

  if (!payload.db.deleteBranchGlobal) {
    throw new Error(
      `The database adapter cannot remove a branch's copy of a global, so "${globalSlug}" cannot be merged.`,
    )
  }

  await deleteBranchGlobalVersionChain({ branch, globalSlug, payload, req })
  await payload.db.deleteBranchGlobal({ branch, globalSlug, req })
}

export const getBranchesLocalAPI = (payload: Payload) => ({
  discard: (options: DiscardOptions) => discardBranchChanges(payload, options),
  merge: (options: MergeOptions) => mergeBranch(payload, options),
})
