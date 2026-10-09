import type { Payload, PayloadRequest } from '../../types/index.js'
import type { MergeableChange, MergeEventChange } from '../types.js'

import { getVersionsMax } from '../../utilities/getVersionsConfig.js'
import { enforceMaxVersions } from '../../versions/enforceMaxVersions.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchField,
  branchMergesCollectionSlug,
} from '../types.js'
import { deleteBranchGlobalVersionChain, deleteBranchVersionChain } from '../versions.js'
import { deleteVersionsByID } from './applyMergeChange.js'
import {
  getGlobalSourceRevision,
  getMergeErrorMessage,
  getTimestamp,
  readSerializedGlobalSourceStates,
} from './utilities.js'

type PersistedMergeEvent = {
  changes?: MergeEventChange[]
  completedAt?: string
  error?: string
  id: number | string
}

type RetryableCleanupCandidate = {
  change: MergeEventChange
  event: PersistedMergeEvent
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

const findRetryableCleanupCandidates = async ({
  branch,
  payload,
  req,
  selected,
}: {
  branch: string
  payload: Payload
  req: PayloadRequest
  selected?: (number | string)[]
}): Promise<RetryableCleanupCandidate[]> => {
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
  const candidateChangeIDs = new Set<string>()
  const candidates: RetryableCleanupCandidate[] = []

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
        candidateChangeIDs.has(change.changeID) ||
        (selectedChangeIDs && !selectedChangeIDs.has(change.changeID)) ||
        change.applicationOutcome !== 'committed' ||
        change.cleanupOutcome !== 'failed' ||
        (!canRetryCollection && !canRetryCreatedCollection && !canRetryGlobal)
      ) {
        continue
      }

      candidateChangeIDs.add(change.changeID)
      candidates.push({ change, event })
    }
  }

  return candidates
}

/**
 * Finds cleanup recovery work without changing persisted state.
 *
 * Merge preparation uses this result to exclude already-committed changes from
 * normal target writes. The actual cleanup starts only after the branch has
 * been conditionally claimed as `merging`.
 */
export const inspectFailedCleanups = async ({
  branch,
  payload,
  req,
  selected,
}: {
  branch: string
  payload: Payload
  req: PayloadRequest
  selected?: (number | string)[]
}): Promise<{ handledChangeIDs: Set<string>; retryable: MergeableChange[] }> => {
  const candidates = await findRetryableCleanupCandidates({ branch, payload, req, selected })
  const retryable = candidates.flatMap(({ change }) => {
    const mergeableChange = toMergeableChange({ change })

    return mergeableChange ? [mergeableChange] : []
  })

  return {
    handledChangeIDs: new Set(retryable.map(({ changeID }) => String(changeID))),
    retryable,
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

/**
 * Retries only the source cleanup recorded by a committed merge event.
 *
 * The target write is already durable. Replaying it would run hooks and create
 * versions again, so cleanup uses the stored source row identity and revision.
 * A changed source row belongs to newer branch work and is left for the normal
 * merge path.
 */
export const retryFailedCleanups = async ({
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
  const candidates = await findRetryableCleanupCandidates({ branch, payload, req, selected })
  const handledChangeIDs = new Set<string>()
  const retried: MergeableChange[] = []

  for (const { change, event } of candidates) {
    const canRetryGlobal = Boolean(change.globalSlug && change.sourceRevision)
    const canRetryCreatedCollection = Boolean(
      change.collectionSlug &&
        change.operation === 'create' &&
        change.sourceID &&
        change.sourceVersionIDs,
    )

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

  return { handledChangeIDs, retried }
}
