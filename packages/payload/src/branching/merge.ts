import { createHash } from 'node:crypto'

import type { ArrayField, BlocksField, Field } from '../fields/config/types.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { DiscardOptions } from './discard.js'
import type { ResolvedChange } from './effectiveOperations.js'
import type { BlockedChange } from './preflight.js'
import type { BranchOperation } from './types.js'
import type { BranchMergeValidationError } from './validation.js'

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
  scheduleAfterTransactionCommit,
  scheduleAfterTransactionRollback,
} from '../utilities/transactionCallbacks.js'
import { traverseForLocalizedFields } from '../utilities/traverseForLocalizedFields.js'
import {
  enforceMaxVersions,
  skipEnforceMaxVersionsContextKey,
} from '../versions/enforceMaxVersions.js'
import {
  type CaptureSavedVersionID,
  captureSavedVersionIDContextKey,
} from '../versions/saveVersion.js'
import { coalesceLatestVersionContextKey } from '../versions/updateLatestVersion.js'
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
import { readCollectionMergeSnapshot } from './readMergeSnapshot.js'
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
import {
  createBranchMergeValidationRequest,
  createMainBranchRequest,
  prepareBranchMergeValidationCandidates,
} from './validation.js'
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
  validationErrors: BranchMergeValidationError[]
  warnings: MergeWarning[]
}

type MergeApplicationOutcome =
  | 'applied'
  | 'attempted'
  | 'committed'
  | 'failed'
  | 'rolledBack'
  | 'unattempted'
  | 'unknown'

type MergeEventChange = {
  after?: unknown
  afterVersionID?: string
  applicationOutcome: MergeApplicationOutcome
  before?: unknown
  beforeVersionID?: string
  changeID: string
  cleanupError?: string
  cleanupOutcome: 'completed' | 'failed' | 'notNeeded' | 'pending' | 'superseded' | 'unknown'
  collectionSlug?: string
  docID?: string
  docTitle: string
  error?: string
  globalSlug?: string
  operation: BranchOperation
  recoveryError?: string
  recoveryOutcome:
    | 'deleted'
    | 'failed'
    | 'notNeeded'
    | 'pending'
    | 'restored'
    | 'unavailable'
    | 'unknown'
  sourceID?: string
  sourceRevision?: string
  sourceUpdatedAt?: string
  sourceVersionIDs?: (number | string)[]
  targetID?: string
}

type SourceCleanupOutcome = 'completed' | 'superseded'
type SourceRecoveryOutcome = 'deleted' | 'restored'

type AppliedChangeResult = {
  cleanup: () => Promise<SourceCleanupOutcome>
  recover?: () => Promise<SourceRecoveryOutcome>
  sourceID?: string
  sourceRevision?: string
  sourceUpdatedAt?: string
  sourceVersionIDs?: (number | string)[]
}

type PersistedMergeEvent = {
  changes?: MergeEventChange[]
  completedAt?: string
  error?: string
  id: number | string
  mergedAt?: string
  status?: string
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

const getMergeErrorMessage = ({ error }: { error: unknown }): string =>
  error instanceof Error ? error.message : String(error)

const getTimestamp = ({ value }: { value: unknown }): number | undefined => {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    return undefined
  }

  const timestamp = new Date(value).getTime()

  return Number.isNaN(timestamp) ? undefined : timestamp
}

const findLatestTargetCollectionVersionID = async ({
  collectionSlug,
  docID,
  payload,
  req,
}: {
  collectionSlug: string
  docID: number | string
  payload: Payload
  req: PayloadRequest
}): Promise<string | undefined> => {
  if (!payload.collections[collectionSlug]?.config.versions) {
    return undefined
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: collectionSlug,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: { parent: { equals: docID } },
  })
  const versionID = docs[0]?.id

  return versionID === undefined ? undefined : String(versionID)
}

const findLatestTargetGlobalVersionID = async ({
  globalSlug,
  payload,
  req,
}: {
  globalSlug: string
  payload: Payload
  req: PayloadRequest
}): Promise<string | undefined> => {
  const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)

  if (!globalConfig?.versions) {
    return undefined
  }

  const { docs } = await payload.db.findGlobalVersions({
    branch: false,
    global: globalSlug,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: { [branchField]: { equals: MAIN_BRANCH } },
  })
  const versionID = docs[0]?.id

  return versionID === undefined ? undefined : String(versionID)
}

const hasTargetVersion = async ({
  change,
  payload,
  req,
}: {
  change: MergeEventChange
  payload: Payload
  req: PayloadRequest
}): Promise<boolean> => {
  if (!change.beforeVersionID) {
    return false
  }

  if (change.globalSlug) {
    const { docs } = await payload.db.findGlobalVersions({
      branch: false,
      global: change.globalSlug,
      limit: 1,
      pagination: false,
      req,
      where: { id: { equals: change.beforeVersionID } },
    })

    return docs.length > 0
  }

  if (!change.collectionSlug) {
    return false
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: change.collectionSlug,
    limit: 1,
    pagination: false,
    req,
    where: {
      and: [{ id: { equals: change.beforeVersionID } }, { parent: { equals: change.targetID } }],
    },
  })

  return docs.length > 0
}

const updateMergeEventChange = ({
  changeID,
  changes,
  update,
}: {
  changeID: number | string
  changes: MergeEventChange[]
  update: Partial<MergeEventChange>
}): MergeEventChange[] =>
  changes.map((change) =>
    change.changeID === String(changeID) ? { ...change, ...update } : change,
  )

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

const toMergeableChange = ({ change }: { change: MergeEventChange }): MergeableChange | null => {
  if (change.globalSlug) {
    return {
      changeID: change.changeID,
      entityType: 'global',
      globalSlug: change.globalSlug,
      operation: change.operation,
    }
  }

  if (!change.collectionSlug || change.docID === undefined) {
    return null
  }

  return {
    changeID: change.changeID,
    collectionSlug: change.collectionSlug,
    docID: change.docID,
    entityType: 'collection',
    operation: change.operation,
  }
}

const persistRetriedMergeEvent = async ({
  event,
  payload,
  req,
}: {
  event: PersistedMergeEvent
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  const changes = event.changes ?? []
  const hasUnresolvedCleanup = changes.some(({ cleanupOutcome }) =>
    ['failed', 'pending', 'unknown'].includes(cleanupOutcome),
  )

  await payload.update({
    id: event.id,
    collection: branchMergesCollectionSlug,
    data: {
      changes,
      completedAt: hasUnresolvedCleanup ? event.completedAt : new Date().toISOString(),
      error: hasUnresolvedCleanup ? event.error : null,
      status: hasUnresolvedCleanup ? 'cleanupFailed' : 'succeeded',
    },
    overrideAccess: true,
    req,
  })
}

type SerializedGlobalSourceState = {
  data: string
  draft: boolean
  locale: string
}

const getGlobalSourceRevision = ({
  sourceStates,
}: {
  sourceStates: SerializedGlobalSourceState[]
}): string => createHash('sha256').update(JSON.stringify(sourceStates)).digest('hex')

const readSerializedGlobalSourceStates = async ({
  branch,
  globalSlug,
  payload,
  req,
}: {
  branch: string
  globalSlug: string
  payload: Payload
  req: PayloadRequest
}): Promise<SerializedGlobalSourceState[]> => {
  const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })
  const locales = getGlobalMergeLocales({ globalSlug, payload, req })
  const sourceStates: SerializedGlobalSourceState[] = []

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

      if (data) {
        sourceStates.push({ data: JSON.stringify(data), draft: write.draft, locale })
      }
    }
  }

  return sourceStates
}

/**
 * Retries only the source cleanup recorded by a committed merge event.
 *
 * The target write is already durable. Replaying it would run hooks and create
 * versions again, so cleanup uses the stored source row identity and revision.
 * A changed source row belongs to newer branch work and is left for the normal
 * merge path.
 */
const retryFailedCleanups = async ({
  branch,
  payload,
  req,
  selected,
}: {
  branch: string
  payload: Payload
  req: PayloadRequest
  selected?: (number | string)[]
}): Promise<{ handledChangeIDs: Set<string>; retried: MergeableChange[] }> => {
  const failedEvents = await payload.find({
    collection: branchMergesCollectionSlug,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    req,
    sort: '-startedAt',
    where: {
      and: [{ branch: { equals: branch } }, { status: { equals: 'cleanupFailed' } }],
    },
  })
  const selectedChangeIDs = selected ? new Set(selected.map(String)) : null
  const handledChangeIDs = new Set<string>()
  const retried: MergeableChange[] = []
  const retriedChangeIDs = new Set<string>()

  for (const eventDocument of failedEvents.docs) {
    const event = eventDocument as unknown as PersistedMergeEvent

    for (const change of event.changes ?? []) {
      const canRetryCollection = Boolean(
        change.collectionSlug &&
          change.sourceID &&
          change.sourceUpdatedAt &&
          change.operation !== 'create',
      )
      const canRetryGlobal = Boolean(change.globalSlug && change.sourceRevision)
      const canRetryCreatedCollection = Boolean(
        change.collectionSlug &&
          change.operation === 'create' &&
          change.sourceID &&
          change.sourceVersionIDs,
      )

      if (
        retriedChangeIDs.has(change.changeID) ||
        (selectedChangeIDs && !selectedChangeIDs.has(change.changeID)) ||
        change.applicationOutcome !== 'committed' ||
        change.cleanupOutcome !== 'failed' ||
        (!canRetryCollection && !canRetryCreatedCollection && !canRetryGlobal)
      ) {
        continue
      }

      event.changes = updateMergeEventChange({
        changeID: change.changeID,
        changes: event.changes ?? [],
        update: { cleanupError: undefined, cleanupOutcome: 'pending' },
      })
      await persistRetriedMergeEvent({ event, payload, req })

      try {
        let isSuperseded = false

        if (canRetryGlobal) {
          const currentSourceStates = await readSerializedGlobalSourceStates({
            branch,
            globalSlug: change.globalSlug!,
            payload,
            req,
          })

          isSuperseded =
            currentSourceStates.length > 0 &&
            getGlobalSourceRevision({ sourceStates: currentSourceStates }) !== change.sourceRevision

          if (!isSuperseded) {
            await deleteBranchGlobalVersionChain({
              branch,
              globalSlug: change.globalSlug!,
              payload,
              req,
            })
            await payload.db.deleteBranchGlobal?.({
              branch,
              globalSlug: change.globalSlug!,
              req,
            })
          }
        } else if (canRetryCreatedCollection) {
          const newerSource = await payload.db.findOne({
            branch: false,
            collection: change.collectionSlug!,
            req,
            where: {
              and: [
                { [branchField]: { equals: branch } },
                { [branchDocIDField]: { equals: change.targetID } },
              ],
            },
          })

          isSuperseded = Boolean(newerSource)

          if (!isSuperseded) {
            await deleteVersionsByID({
              collectionSlug: change.collectionSlug!,
              ids: change.sourceVersionIDs!,
              payload,
              req,
            })

            const collection = payload.collections[change.collectionSlug!]!.config
            const maxVersions = getVersionsMax(collection)

            if (maxVersions > 0) {
              await enforceMaxVersions({
                id: change.sourceID!,
                collection,
                max: maxVersions,
                payload,
                req,
              })
            }
          }
        } else {
          const source = (await payload.db.findOne({
            branch: false,
            collection: change.collectionSlug!,
            req,
            where: { id: { equals: change.sourceID! } },
          })) as null | Record<string, unknown>
          const currentSourceUpdatedAt = getTimestamp({ value: source?.updatedAt })
          const mergedSourceUpdatedAt = getTimestamp({ value: change.sourceUpdatedAt })

          isSuperseded = Boolean(
            source &&
              currentSourceUpdatedAt !== undefined &&
              mergedSourceUpdatedAt !== undefined &&
              currentSourceUpdatedAt !== mergedSourceUpdatedAt,
          )

          if (!isSuperseded && source) {
            await deleteBranchVersionChain({
              branch,
              collectionSlug: change.collectionSlug!,
              payload,
              req,
              rowID: change.sourceID!,
            })
            await payload.db.deleteOne({
              branch: false,
              collection: change.collectionSlug!,
              req,
              where: { id: { equals: change.sourceID! } },
            })
          }
        }

        if (isSuperseded) {
          event.changes = updateMergeEventChange({
            changeID: change.changeID,
            changes: event.changes,
            update: { cleanupOutcome: 'superseded' },
          })
          await persistRetriedMergeEvent({ event, payload, req })
          handledChangeIDs.add(change.changeID)
          retriedChangeIDs.add(change.changeID)
          continue
        }

        const changeRecord = await payload.db.findOne({
          collection: branchChangesCollectionSlug,
          req,
          where: { id: { equals: change.changeID } },
        })

        if (changeRecord) {
          await payload.delete({
            id: change.changeID,
            collection: branchChangesCollectionSlug,
            overrideAccess: true,
            req,
          })
        }

        event.changes = updateMergeEventChange({
          changeID: change.changeID,
          changes: event.changes,
          update: { cleanupOutcome: 'completed' },
        })
        await persistRetriedMergeEvent({ event, payload, req })

        const mergeableChange = toMergeableChange({ change })

        if (mergeableChange) {
          retried.push(mergeableChange)
        }
        handledChangeIDs.add(change.changeID)
        retriedChangeIDs.add(change.changeID)
      } catch (error) {
        const cleanupError = getMergeErrorMessage({ error })

        event.changes = updateMergeEventChange({
          changeID: change.changeID,
          changes: event.changes,
          update: { cleanupError, cleanupOutcome: 'failed' },
        })
        event.error = cleanupError
        await persistRetriedMergeEvent({ event, payload, req })

        throw error
      }
    }
  }

  return { handledChangeIDs, retried }
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

  const cleanupRetry = dryRun
    ? { handledChangeIDs: new Set<string>(), retried: [] }
    : await retryFailedCleanups({ branch, payload, req, selected })
  const retriedCleanups = cleanupRetry.retried

  const allChanges = await payload.find({
    collection: branchChangesCollectionSlug,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'createdAt',
    where: { branch: { equals: branch } },
  })

  const selectedChanges = allChanges.docs.filter(
    (change) =>
      !cleanupRetry.handledChangeIDs.has(String(change.id)) &&
      (!selected || selected.map(String).includes(String(change.id))),
  )

  // Globals travel the same registry but not the same pipeline: there is one of each, so
  // there is no shadow row to resolve, no effective-operation table to consult (§7 is
  // about create/update/delete of documents) and nothing to collide on a unique index.
  const pending = selectedChanges.filter((change) => change.entityType !== 'global')
  const pendingGlobals = selectedChanges.filter((change) => change.entityType === 'global')

  const resolved = await resolveEffectiveOperations({ branch, changes: pending, payload, req })
  const targetReq = createMainBranchRequest({ req })

  // This first pass describes which changes the user can select. Each selected
  // change is checked again inside the transaction immediately before its real
  // write, because hooks can change access-relevant state after this point.
  const blocked = overrideAccess
    ? []
    : await runMergePreflight({ payload, pending: resolved, req: targetReq })
  const blockedGlobals = overrideAccess
    ? []
    : await runGlobalMergePreflight({ payload, pending: pendingGlobals, req: targetReq })
  blocked.push(...blockedGlobals)

  blocked.push(
    ...(await runMergeDependencyPreflight({
      initiallyBlocked: blocked,
      payload,
      pending: resolved,
      pendingGlobals,
      req: targetReq,
    })),
  )

  const validationCandidates = await prepareBranchMergeValidationCandidates({
    payload,
    pending: resolved,
    pendingGlobals,
    req: targetReq,
  })
  const validation = await payload.config.branching.validate({
    branch,
    candidates: validationCandidates,
    req: createBranchMergeValidationRequest({ req: targetReq }),
    target: MAIN_BRANCH,
  })
  const hasPreflightErrors = blocked.length > 0 || !validation.valid
  const applicable = hasPreflightErrors ? [] : pending
  const applicableGlobals = hasPreflightErrors ? [] : pendingGlobals

  const mergeable: MergeableChange[] = [
    ...retriedCleanups,
    ...applicable.map((change) => ({
      changeID: change.id,
      collectionSlug: change.collectionSlug as string,
      docID: changeDocID(change),
      entityType: 'collection' as const,
      operation: change.operation as BranchOperation,
    })),
  ]

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
    merged: [...retriedCleanups],
    validationErrors: validation.errors,
    warnings,
  }

  const hasChangesToApply = applicable.length > 0 || applicableGlobals.length > 0

  if (dryRun || !hasChangesToApply) {
    if (!dryRun && retriedCleanups.length && allChanges.docs.length === 0) {
      const mergedAt = new Date().toISOString()

      await payload.update({
        id: branchDoc.id,
        collection: branchesCollectionSlug,
        data: { mergedAt, status: closeBranch ? 'closed' : 'merged' },
        overrideAccess: true,
        req,
      })

      if (incomingReq) {
        refreshBranchState(incomingReq)
      }
    }

    return result
  }

  const branchingHooks = payload.config.branching?.hooks

  await branchingHooks?.beforeMerge?.({ branch, changes: mergeable, req, warnings })

  const refreshedResolved = await resolveEffectiveOperations({
    branch,
    changes: applicable,
    payload,
    req,
  })
  const refreshedTargetReq = createMainBranchRequest({ req })
  const blockedAfterHook = overrideAccess
    ? []
    : await runMergePreflight({ payload, pending: refreshedResolved, req: refreshedTargetReq })
  const blockedGlobalsAfterHook = overrideAccess
    ? []
    : await runGlobalMergePreflight({
        payload,
        pending: applicableGlobals,
        req: refreshedTargetReq,
      })

  blockedAfterHook.push(...blockedGlobalsAfterHook)
  blockedAfterHook.push(
    ...(await runMergeDependencyPreflight({
      initiallyBlocked: blockedAfterHook,
      payload,
      pending: refreshedResolved,
      pendingGlobals: applicableGlobals,
      req: refreshedTargetReq,
    })),
  )

  const refreshedValidationCandidates = await prepareBranchMergeValidationCandidates({
    payload,
    pending: refreshedResolved,
    pendingGlobals: applicableGlobals,
    req: refreshedTargetReq,
  })
  const refreshedValidation = await payload.config.branching.validate({
    branch,
    candidates: refreshedValidationCandidates,
    req: createBranchMergeValidationRequest({ req: refreshedTargetReq }),
    target: MAIN_BRANCH,
  })

  if (blockedAfterHook.length || !refreshedValidation.valid) {
    result.blocked = blockedAfterHook
    result.canMerge = false
    result.mergeable = []
    result.validationErrors = refreshedValidation.errors

    return result
  }

  const startedAt = new Date().toISOString()
  const mergeEventReq = await createPayloadRequest({
    branch: false,
    payload,
    user: req.user ?? undefined,
  })
  let mergeEventChanges: MergeEventChange[] = mergeable.map((change) => ({
    applicationOutcome: 'unattempted',
    changeID: String(change.changeID),
    cleanupOutcome: 'pending',
    collectionSlug: change.collectionSlug,
    docID: change.docID === undefined ? undefined : String(change.docID),
    docTitle: String(change.docID ?? change.globalSlug),
    globalSlug: change.globalSlug,
    operation: change.operation,
    recoveryOutcome: 'notNeeded',
    targetID: change.docID === undefined ? change.globalSlug : String(change.docID),
  }))
  const mergeEvent = await payload.create({
    collection: branchMergesCollectionSlug,
    data: {
      branch,
      changes: mergeEventChanges,
      mergedByCollection: req.user?.collection,
      mergedByID: req.user?.id === undefined ? undefined : String(req.user.id),
      mergedByLabel: (req.user as { email?: string } | null)?.email,
      startedAt,
      status: 'inProgress',
      targetBranch: MAIN_BRANCH,
    },
    overrideAccess: true,
    req: mergeEventReq,
  })
  const persistMergeEvent = async ({
    completedAt,
    error,
    mergedAt,
    status,
  }: {
    completedAt?: string
    error?: string
    mergedAt?: string
    status: 'awaitingCommit' | 'cleanupFailed' | 'failed' | 'inProgress' | 'succeeded'
  }): Promise<void> => {
    await payload.update({
      id: mergeEvent.id,
      collection: branchMergesCollectionSlug,
      data: { changes: mergeEventChanges, completedAt, error, mergedAt, status },
      overrideAccess: true,
      req: mergeEventReq,
    })
  }
  const persistAppliedMergeEvent = async ({
    changeID,
  }: {
    changeID: number | string
  }): Promise<void> => {
    try {
      await persistMergeEvent({ status: 'inProgress' })
    } catch (error) {
      const errorMessage = getMergeErrorMessage({ error })

      mergeEventChanges = updateMergeEventChange({
        changeID,
        changes: mergeEventChanges,
        update: {
          applicationOutcome: 'unknown',
          error: errorMessage,
          recoveryOutcome: 'unknown',
        },
      })

      throw error
    }
  }
  const persistRecoveryMergeEvent = async ({
    changeID,
  }: {
    changeID: number | string
  }): Promise<boolean> => {
    try {
      await persistMergeEvent({ status: 'inProgress' })

      return true
    } catch (error) {
      const recoveryError = getMergeErrorMessage({ error })
      const change = mergeEventChanges.find(
        ({ changeID: candidateChangeID }) => candidateChangeID === String(changeID),
      )

      mergeEventChanges = updateMergeEventChange({
        changeID,
        changes: mergeEventChanges,
        update: {
          recoveryError: change?.recoveryError
            ? `${change.recoveryError}\n${recoveryError}`
            : recoveryError,
          recoveryOutcome: 'unknown',
        },
      })

      return false
    }
  }

  // Gated on `req.transactionID`, not on whether a `req` was passed in: a merge
  // triggered over HTTP hands in a `req` of its own that has no transaction on
  // it yet, and it must get one just as much as a Local API call would.
  const shouldCommit = await initTransaction(req)
  const transactionID = req.transactionID ? await req.transactionID : undefined
  const hasTransaction = transactionID !== null && transactionID !== undefined
  const cleanupScope = await beginDeferredCleanupScope({ req })

  const uploadCleanupPlans: {
    changeID: number | string
    collectionSlug: string
    retainedDoc: null | Record<string, unknown>
    sourceDoc: Record<string, unknown>
  }[] = []
  const sourceCleanupPlans: {
    changeID: number | string
    cleanup: () => Promise<SourceCleanupOutcome>
    recover?: () => Promise<SourceRecoveryOutcome>
  }[] = []
  const appliedChangeIDs = new Set<string>()
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
        availableChangeIDs: appliedChangeIDs,
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

  let activeChangeID: number | string | undefined
  let mergedAt: string | undefined

  const finalizeMergeAfterCommit = async (): Promise<void> => {
    const cleanupErrors: string[] = []

    mergeEventChanges = mergeEventChanges.map((change) => ({
      ...change,
      applicationOutcome:
        change.applicationOutcome === 'applied' ? 'committed' : change.applicationOutcome,
    }))
    await persistMergeEvent({ mergedAt, status: 'inProgress' })

    for (const { changeID, cleanup } of sourceCleanupPlans) {
      let cleanupError: string | undefined
      let cleanupOutcome: SourceCleanupOutcome = 'completed'

      try {
        cleanupOutcome = await cleanup()

        if (cleanupOutcome === 'completed') {
          await payload.delete({
            id: changeID,
            collection: branchChangesCollectionSlug,
            overrideAccess: true,
            req,
          })
        }

        const uploadCleanupPlan = uploadCleanupPlans.find(
          (plan) => String(plan.changeID) === String(changeID),
        )

        if (cleanupOutcome === 'completed' && uploadCleanupPlan) {
          await deleteUploadFilesExclusiveToDocument({
            collectionConfig: payload.collections[uploadCleanupPlan.collectionSlug]!.config,
            config: payload.config,
            req,
            retainedDoc: uploadCleanupPlan.retainedDoc,
            sourceDoc: uploadCleanupPlan.sourceDoc,
          })
        }
      } catch (error) {
        cleanupError = getMergeErrorMessage({ error })
        cleanupErrors.push(cleanupError)
      }

      mergeEventChanges = updateMergeEventChange({
        changeID,
        changes: mergeEventChanges,
        update: cleanupError
          ? { cleanupError, cleanupOutcome: 'failed' }
          : { cleanupError: undefined, cleanupOutcome },
      })
      await persistMergeEvent({
        error: cleanupErrors.length ? cleanupErrors.join('\n') : undefined,
        mergedAt,
        status: cleanupErrors.length ? 'cleanupFailed' : 'inProgress',
      })
    }

    try {
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
          data: { mergedAt, status: closeBranch ? 'closed' : 'merged' },
          overrideAccess: true,
          req,
        })
      }
    } catch (error) {
      cleanupErrors.push(getMergeErrorMessage({ error }))
    }

    const completedAt = new Date().toISOString()

    await persistMergeEvent({
      completedAt,
      error: cleanupErrors.length ? cleanupErrors.join('\n') : undefined,
      mergedAt: mergedAt ?? completedAt,
      status: cleanupErrors.length ? 'cleanupFailed' : 'succeeded',
    })

    // Fired after commit: a failing deploy webhook must not undo a merge.
    await branchingHooks?.afterMerge?.({ branch, req, results: result.merged })

    if (incomingReq) {
      refreshBranchState(incomingReq)
    }
  }

  const recordMergeRollback = async (): Promise<void> => {
    const error = 'Caller-owned transaction rolled back.'

    mergeEventChanges = mergeEventChanges.map((change) =>
      change.applicationOutcome === 'applied'
        ? { ...change, applicationOutcome: 'rolledBack' }
        : change,
    )
    await persistMergeEvent({
      completedAt: new Date().toISOString(),
      error,
      status: 'failed',
    })

    if (incomingReq) {
      refreshBranchState(incomingReq)
    }
  }

  try {
    const writeTargetReq = createMainBranchRequest({ req })
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
      activeChangeID = change.id
      mergeEventChanges = updateMergeEventChange({
        changeID: change.id,
        changes: mergeEventChanges,
        update: { applicationOutcome: 'attempted' },
      })
      await persistMergeEvent({ status: 'inProgress' })

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
          req: writeTargetReq,
        })

        if (blockedAtUse.length) {
          throw new Forbidden(req.t)
        }
      }

      const collectionSlug = change.collectionSlug as string
      const docID = changeDocID(change)
      const collectionConfig = payload.collections[collectionSlug]!.config
      const beforeVersionID =
        change.operation === 'create'
          ? undefined
          : await findLatestTargetCollectionVersionID({
              collectionSlug,
              docID,
              payload,
              req: writeTargetReq,
            })
      let afterVersionID: string | undefined
      const writeTargetContext = writeTargetReq.context as Record<PropertyKey, unknown>
      const previousCaptureSavedVersionID = writeTargetContext[captureSavedVersionIDContextKey]

      writeTargetContext[captureSavedVersionIDContextKey] = ((capturedVersion) => {
        if (capturedVersion.collectionSlug === collectionSlug) {
          afterVersionID = String(capturedVersion.versionID)
        }
      }) satisfies CaptureSavedVersionID
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
        availableChangeIDs: appliedChangeIDs,
        initiallyBlocked: [],
        payload,
        pending: [resolvedChange],
        pendingGlobals: [],
        req: writeTargetReq,
      })

      if (dependencyBlockedAtUse.length) {
        throw new APIError(dependencyBlockedAtUse[0]!.message, 409)
      }

      let appliedChange: AppliedChangeResult

      try {
        appliedChange = await applyChange({
          hasTransaction,
          overrideAccess,
          payload,
          req,
          resolved: resolvedChange,
          targetReq: writeTargetReq,
        })
      } finally {
        if (previousCaptureSavedVersionID === undefined) {
          delete writeTargetContext[captureSavedVersionIDContextKey]
        } else {
          writeTargetContext[captureSavedVersionIDContextKey] = previousCaptureSavedVersionID
        }
      }

      sourceCleanupPlans.push({ changeID: change.id, ...appliedChange })
      appliedChangeIDs.add(String(change.id))
      mergeEventChanges = updateMergeEventChange({
        changeID: change.id,
        changes: mergeEventChanges,
        update: {
          afterVersionID,
          applicationOutcome: 'applied',
          beforeVersionID,
          sourceID: appliedChange.sourceID,
          sourceUpdatedAt: appliedChange.sourceUpdatedAt,
          sourceVersionIDs: appliedChange.sourceVersionIDs,
        },
      })
      await persistAppliedMergeEvent({ changeID: change.id })

      if (uploadSourceDoc) {
        const retainedDoc = (await payload.db.findOne({
          branch: false,
          collection: collectionSlug,
          req,
          where: {
            and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
          },
        })) as null | Record<string, unknown>

        uploadCleanupPlans.push({
          changeID: change.id,
          collectionSlug,
          retainedDoc,
          sourceDoc: uploadSourceDoc,
        })
      }

      const persistedTarget = await readCollectionMergeSnapshot({
        collectionSlug,
        docID,
        payload,
        req,
      })

      mergeEventChanges = updateMergeEventChange({
        changeID: change.id,
        changes: mergeEventChanges,
        update: {
          docTitle: getSnapshotDocumentTitle({
            after: persistedTarget,
            docID,
            useAsTitle: collectionConfig.admin?.useAsTitle,
          }),
        },
      })

      result.merged.push({
        changeID: change.id,
        collectionSlug: change.collectionSlug as string,
        docID: changeDocID(change),
        entityType: 'collection',
        operation: change.operation as BranchOperation,
      })
      activeChangeID = undefined
    }

    // Globals, after the documents. Ordered that way because a global usually points at
    // documents rather than the other way round, so merging it last means whatever it
    // references is already on main.
    for (const [index, change] of applicableGlobals.entries()) {
      const globalSlug = change.globalSlug as string

      activeChangeID = change.id
      mergeEventChanges = updateMergeEventChange({
        changeID: change.id,
        changes: mergeEventChanges,
        update: { applicationOutcome: 'attempted' },
      })
      await persistMergeEvent({ status: 'inProgress' })

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
        const blockedAtUse = await runGlobalMergePreflight({
          payload,
          pending: [change],
          req: writeTargetReq,
        })

        if (blockedAtUse.length) {
          throw new Forbidden(req.t)
        }
      }

      const beforeVersionID = await findLatestTargetGlobalVersionID({
        globalSlug,
        payload,
        req: writeTargetReq,
      })
      let afterVersionID: string | undefined
      const writeTargetContext = writeTargetReq.context as Record<PropertyKey, unknown>
      const previousCaptureSavedVersionID = writeTargetContext[captureSavedVersionIDContextKey]

      writeTargetContext[captureSavedVersionIDContextKey] = ((capturedVersion) => {
        if (capturedVersion.globalSlug === globalSlug) {
          afterVersionID = String(capturedVersion.versionID)
        }
      }) satisfies CaptureSavedVersionID

      const dependencyBlockedAtUse = await runMergeDependencyPreflight({
        availableChangeIDs: appliedChangeIDs,
        initiallyBlocked: [],
        payload,
        pending: [],
        pendingGlobals: [change],
        req: writeTargetReq,
      })

      if (dependencyBlockedAtUse.length) {
        throw new APIError(dependencyBlockedAtUse[0]!.message, 409)
      }

      let appliedGlobal: AppliedChangeResult

      try {
        appliedGlobal = await applyGlobalChange({
          branch,
          globalSlug,
          overrideAccess,
          payload,
          req,
          targetReq: writeTargetReq,
        })
      } finally {
        if (previousCaptureSavedVersionID === undefined) {
          delete writeTargetContext[captureSavedVersionIDContextKey]
        } else {
          writeTargetContext[captureSavedVersionIDContextKey] = previousCaptureSavedVersionID
        }
      }

      sourceCleanupPlans.push({ changeID: change.id, ...appliedGlobal })
      appliedChangeIDs.add(String(change.id))
      mergeEventChanges = updateMergeEventChange({
        changeID: change.id,
        changes: mergeEventChanges,
        update: {
          afterVersionID,
          applicationOutcome: 'applied',
          beforeVersionID,
          sourceRevision: appliedGlobal.sourceRevision,
        },
      })
      await persistAppliedMergeEvent({ changeID: change.id })

      const globalConfig = payload.globals?.config?.find((config) => config.slug === globalSlug)

      mergeEventChanges = updateMergeEventChange({
        changeID: change.id,
        changes: mergeEventChanges,
        update: {
          docTitle: typeof globalConfig?.label === 'string' ? globalConfig.label : globalSlug,
        },
      })

      result.merged.push({
        changeID: change.id,
        entityType: 'global',
        globalSlug,
        operation: 'update',
      })
      activeChangeID = undefined
    }

    mergedAt = new Date().toISOString()

    if (cleanupScope) {
      await flushDeferredCleanupScopeAfterOperation({ req, scope: cleanupScope })
    }

    if (hasTransaction) {
      await persistMergeEvent({ mergedAt, status: 'awaitingCommit' })
      await scheduleAfterTransactionCommit({ callback: finalizeMergeAfterCommit, req })
      await scheduleAfterTransactionRollback({ callback: recordMergeRollback, req })
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
      mergeEventChanges = mergeEventChanges.map((change) =>
        change.applicationOutcome === 'applied'
          ? { ...change, applicationOutcome: 'rolledBack', cleanupOutcome: 'pending' }
          : change,
      )
    }

    if (!hasTransaction) {
      for (const recoveryPlan of [...sourceCleanupPlans].reverse()) {
        const change = mergeEventChanges.find(
          ({ changeID }) => changeID === String(recoveryPlan.changeID),
        )

        if (!change || change.applicationOutcome !== 'applied') {
          continue
        }

        mergeEventChanges = updateMergeEventChange({
          changeID: change.changeID,
          changes: mergeEventChanges,
          update: { recoveryOutcome: 'pending' },
        })

        if (!(await persistRecoveryMergeEvent({ changeID: change.changeID }))) {
          continue
        }

        if (
          !recoveryPlan.recover &&
          (!change.beforeVersionID || (!change.collectionSlug && !change.globalSlug))
        ) {
          mergeEventChanges = updateMergeEventChange({
            changeID: change.changeID,
            changes: mergeEventChanges,
            update: { recoveryOutcome: 'unavailable' },
          })
          await persistRecoveryMergeEvent({ changeID: change.changeID })
          continue
        }

        try {
          let recoveryOutcome: SourceRecoveryOutcome

          if (recoveryPlan.recover) {
            recoveryOutcome = await recoveryPlan.recover()
          } else {
            const recoveryReq = createMainBranchRequest({ req })

            if (!(await hasTargetVersion({ change, payload, req: recoveryReq }))) {
              mergeEventChanges = updateMergeEventChange({
                changeID: change.changeID,
                changes: mergeEventChanges,
                update: { recoveryOutcome: 'unavailable' },
              })
              await persistRecoveryMergeEvent({ changeID: change.changeID })
              continue
            }

            if (change.globalSlug) {
              await payload.restoreGlobalVersion({
                id: change.beforeVersionID!,
                slug: change.globalSlug,
                overrideAccess,
                req: recoveryReq,
              })
            } else {
              await payload.restoreVersion({
                id: change.beforeVersionID!,
                collection: change.collectionSlug!,
                overrideAccess,
                req: recoveryReq,
              })
            }

            recoveryOutcome = 'restored'
          }
          mergeEventChanges = updateMergeEventChange({
            changeID: change.changeID,
            changes: mergeEventChanges,
            update: { recoveryOutcome },
          })
        } catch (recoveryError) {
          mergeEventChanges = updateMergeEventChange({
            changeID: change.changeID,
            changes: mergeEventChanges,
            update: {
              recoveryError: getMergeErrorMessage({ error: recoveryError }),
              recoveryOutcome: 'failed',
            },
          })
        }

        await persistRecoveryMergeEvent({ changeID: change.changeID })
      }
    }

    const errorMessage = getMergeErrorMessage({ error })

    if (activeChangeID !== undefined) {
      const activeChange = mergeEventChanges.find(
        (change) => change.changeID === String(activeChangeID),
      )

      if (activeChange?.applicationOutcome === 'attempted') {
        mergeEventChanges = updateMergeEventChange({
          changeID: activeChangeID,
          changes: mergeEventChanges,
          update: { applicationOutcome: 'failed', error: errorMessage },
        })
      }
    }

    try {
      await persistMergeEvent({
        completedAt: new Date().toISOString(),
        error: errorMessage,
        status: 'failed',
      })
    } catch (mergeEventError) {
      payload.logger.error({
        err: mergeEventError,
        msg: 'Failed to record a branch merge failure.',
      })
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

  if (!hasTransaction) {
    await finalizeMergeAfterCommit()
  }

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

const stripGlobalInternal = (data: Record<string, unknown>): Record<string, unknown> => {
  const { globalType: _globalType, ...globalData } = data

  return stripInternal(globalData)
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
  targetReq,
}: {
  hasTransaction: boolean
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
  resolved: ResolvedChange
  targetReq: PayloadRequest
}): Promise<AppliedChangeResult> => {
  const { change, collectionSlug, docID, shadow, writes } = resolved

  if (!shadow) {
    return { cleanup: () => Promise.resolve('completed') }
  }

  const shadowID = shadow.id as number | string
  const branch = change.branch as string
  const mainWriteReq = createMainBranchRequest({ req: targetReq })

  mainWriteReq.file = undefined
  mainWriteReq.payloadUploadSizes = undefined
  mainWriteReq.query = { ...mainWriteReq.query }
  delete mainWriteReq.query.uploadEdits
  delete (mainWriteReq.context as Record<string, unknown>)._payloadCloudStorage
  const sourceTimestamp = getTimestamp({ value: shadow.updatedAt })
  const sourceIdentity = {
    sourceID: String(shadowID),
    sourceUpdatedAt:
      sourceTimestamp === undefined ? undefined : new Date(sourceTimestamp).toISOString(),
  }

  // The chain goes with the row. It hangs off the shadow row's primary key rather
  // than the canonical ID, so nothing addressing the document cascades to it, and a
  // chain left behind keeps the merged document in the branch's drafts list a second
  // time alongside main's copy.
  const dropVersionChain = () =>
    deleteBranchVersionChain({ branch, collectionSlug, payload, req, rowID: shadowID })

  const dropShadowRow = async () => {
    const currentShadow = (await payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: { id: { equals: shadowID } },
    })) as null | Record<string, unknown>

    const currentUpdatedAt = getTimestamp({ value: currentShadow?.updatedAt })
    const mergedSourceUpdatedAt = getTimestamp({ value: shadow.updatedAt })

    if (
      currentUpdatedAt !== undefined &&
      mergedSourceUpdatedAt !== undefined &&
      currentUpdatedAt !== mergedSourceUpdatedAt
    ) {
      return 'superseded' as const
    }

    await dropVersionChain()

    await payload.db.deleteOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: { id: { equals: shadowID } },
    })

    return 'completed' as const
  }

  const updateMainDocument = async ({
    coalesceLatestVersion,
    id,
    data,
    draft,
    locale,
  }: {
    coalesceLatestVersion?: boolean
    data: Record<string, unknown>
    draft: boolean
    id: number | string
    locale?: string
  }): Promise<Record<string, unknown>> => {
    const reqContext = mainWriteReq.context as Record<PropertyKey, unknown>
    const previousBranchMergeUploadData = reqContext[branchMergeUploadDataContextKey]
    const previousCoalesceLatestVersion = reqContext[coalesceLatestVersionContextKey]
    const branchMergeUploadData: BranchMergeUploadDataContext = {
      id,
      collectionSlug,
      data,
    }

    reqContext[branchMergeUploadDataContextKey] = branchMergeUploadData

    if (coalesceLatestVersion) {
      reqContext[coalesceLatestVersionContextKey] = true
    } else {
      delete reqContext[coalesceLatestVersionContextKey]
    }

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
        trash: includesTrashState(data),
      })) as Record<string, unknown>
    } finally {
      if (previousBranchMergeUploadData === undefined) {
        delete reqContext[branchMergeUploadDataContextKey]
      } else {
        reqContext[branchMergeUploadDataContextKey] = previousBranchMergeUploadData
      }

      if (previousCoalesceLatestVersion === undefined) {
        delete reqContext[coalesceLatestVersionContextKey]
      } else {
        reqContext[coalesceLatestVersionContextKey] = previousCoalesceLatestVersion
      }
    }
  }

  if (change.operation === 'delete') {
    await payload.delete({
      id: docID,
      collection: collectionSlug,
      overrideAccess,
      req: targetReq,
    })

    return { cleanup: dropShadowRow, ...sourceIdentity }
  }

  // A fork that was never edited afterwards. Nothing happened to the document on
  // this branch, so writing main would only bump `updatedAt` and re-run hooks for
  // a no-op — the shadow row is simply discarded.
  if (!writes.length) {
    return { cleanup: dropShadowRow, ...sourceIdentity }
  }

  if (change.operation === 'create') {
    const actionableWrites = writes.filter((write) => write.trashState !== 'access')
    const [rowWrite, ...laterWrites] = actionableWrites
    const localization = payload.config.localization
    const hasLocalizedFields = traverseForLocalizedFields(
      payload.collections[collectionSlug]!.config.fields,
    )
    const localeCodes = localization && hasLocalizedFields ? localization.localeCodes : undefined
    let localizedWrites: Map<string, Record<string, unknown>>[] | undefined

    if (localeCodes?.length) {
      localizedWrites = []

      for (const write of actionableWrites) {
        const documentsByLocale = new Map<string, Record<string, unknown>>()

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

          if (branchDoc) {
            documentsByLocale.set(locale, branchDoc)
          }
        }

        localizedWrites.push(documentsByLocale)
      }
    }

    const applyCreateWrites = async () => {
      const createTargetReq = mainWriteReq

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
          const data = stripInternal(branchDoc)

          await updateByIDOperationForBranchMerge({
            id: shadowID,
            branchMergeStorageReq: req,
            collection: payload.collections[collectionSlug]!,
            data: data as never,
            draft: rowWrite!.draft,
            overrideAccess,
            req: withLocale({ locale: createLocale, req: createTargetReq }),
            trash: includesTrashState(data),
          })
        }
      } else {
        const data = stripInternal(rowWrite!.data)

        await updateByIDOperationForBranchMerge({
          id: shadowID,
          branchMergeStorageReq: req,
          collection: payload.collections[collectionSlug]!,
          data: data as never,
          overrideAccess,
          req: createTargetReq,
          trash: includesTrashState(data),
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
        req,
      })

      await applyCreateWrites()

      return { cleanup: () => Promise.resolve('completed'), ...sourceIdentity }
    }

    const appliedCreate = await applyBranchCreateWithoutTransaction({
      applyCreateWrites,
      branch,
      collectionSlug,
      payload,
      req,
      shadow,
      shadowID,
    })

    return { ...appliedCreate, ...sourceIdentity }
  }

  const fields = payload.collections[collectionSlug]!.config.fields
  const localization = payload.config.localization
  const hasLocalizedFields = traverseForLocalizedFields(fields)
  const localeCodes = localization && hasLocalizedFields ? localization.localeCodes : undefined
  const mainRowIDsBySource: NestedRowIDMap = new Map()

  for (const write of writes) {
    if (write.trashState === 'access') {
      continue
    }

    if (write.trashState === 'apply') {
      await payload.update({
        id: docID,
        collection: collectionSlug,
        data: { deletedAt: write.data.deletedAt ?? null } as never,
        draft: false,
        overrideAccess,
        req: targetReq,
        trash: true,
      })

      continue
    }

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
    for (const [localeIndex, locale] of localeCodes.entries()) {
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
        coalesceLatestVersion: localeIndex > 0,
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

  return { cleanup: dropShadowRow, ...sourceIdentity }
}

const includesTrashState = (data: Record<string, unknown>): boolean =>
  Object.prototype.hasOwnProperty.call(data, 'deletedAt')

const withLocale = ({
  coalesceLatestVersion,
  locale,
  req,
}: {
  coalesceLatestVersion?: boolean
  locale: string
  req: PayloadRequest
}): PayloadRequest => {
  const isolated = isolateBranchState(req)

  isolated.locale = locale

  if (coalesceLatestVersion) {
    ;(isolated.context as Record<PropertyKey, unknown>)[coalesceLatestVersionContextKey] = true
  }

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
}): Promise<AppliedChangeResult> => {
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

  const recover = async (): Promise<SourceRecoveryOutcome> => {
    await restoreBranchCreatedShadow({
      branch,
      collectionSlug,
      payload,
      req,
      shadow,
      shadowID,
    })

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

    return 'deleted'
  }

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
  } catch (error) {
    const versionsAfterFailure = await readRawDocumentVersions({
      collectionSlug,
      docID: shadowID,
      payload,
      req,
    })

    preparedVersions = versionsAfterFailure.filter(({ id }) => !existingVersionIDs.has(String(id)))

    await recover()

    throw error
  }

  return {
    cleanup: async () => {
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

      return 'completed'
    },
    recover,
    sourceVersionIDs: [...existingVersionIDs],
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

/** Applies the latest stored state of a branch global to main. */
const applyGlobalChange = async ({
  branch,
  globalSlug,
  overrideAccess,
  payload,
  req,
  targetReq,
}: {
  branch: string
  globalSlug: string
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
  targetReq: PayloadRequest
}): Promise<AppliedChangeResult> => {
  const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })

  if (!writes.length) {
    throw new Error(`Branch "${branch}" has no stored copy of global "${globalSlug}" to merge.`)
  }

  if (!payload.db.deleteBranchGlobal) {
    throw new Error(
      `The database adapter cannot remove a branch's copy of a global, so "${globalSlug}" cannot be merged.`,
    )
  }

  const locales = getGlobalMergeLocales({ globalSlug, payload, req })
  const appliedSourceStates: {
    data: string
    draft: boolean
    locale: string
  }[] = []

  for (const write of writes) {
    for (const [localeIndex, locale] of locales.entries()) {
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

      appliedSourceStates.push({ data: JSON.stringify(data), draft: write.draft, locale })

      await payload.updateGlobal({
        slug: globalSlug,
        data: stripGlobalInternal(data) as never,
        draft: write.draft,
        locale,
        overrideAccess,
        req: withLocale({
          coalesceLatestVersion: localeIndex > 0,
          locale,
          req: targetReq,
        }),
      })
    }
  }

  return {
    cleanup: async () => {
      for (const sourceState of appliedSourceStates) {
        const currentData = await readBranchGlobalWrite({
          branch,
          draft: sourceState.draft,
          globalSlug,
          locale: sourceState.locale,
          payload,
          req,
        })

        if (currentData && JSON.stringify(currentData) !== sourceState.data) {
          return 'superseded'
        }
      }

      await deleteBranchGlobalVersionChain({ branch, globalSlug, payload, req })
      await payload.db.deleteBranchGlobal!({ branch, globalSlug, req })

      return 'completed'
    },
    sourceRevision: getGlobalSourceRevision({ sourceStates: appliedSourceStates }),
  }
}

export const getBranchesLocalAPI = (payload: Payload) => ({
  discard: (options: DiscardOptions) => discardBranchChanges(payload, options),
  merge: (options: MergeOptions) => mergeBranch(payload, options),
})
