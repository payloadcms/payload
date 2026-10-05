import type { PayloadRequest } from '../types/index.js'
import type { BranchOperation } from './types.js'

import { APIError } from '../errors/index.js'
import { ValidationError } from '../errors/ValidationError.js'
import {
  commitTransaction,
  isUnknownTransactionCommitResult,
} from '../utilities/commitTransaction.js'
import { initTransaction } from '../utilities/initTransaction.js'
import { isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
import { killTransaction } from '../utilities/killTransaction.js'
import { branchChangesCollectionSlug, branchDocIDField, branchField } from './types.js'

type ShadowSource = {
  branch: string
  id: number | string
}

type Args = {
  branch: string
  collectionSlug: string
  data: Record<string, unknown>
  /** The canonical document this row represents, for the recovery read on conflict. */
  docID: number | string
  /**
   * Runs only when this call creates the row, inside the same transaction
   * as the row create — typically the accompanying
   * `payload-branch-changes` entry. Never called on the losing side, whose
   * caller already created (or is creating) its own.
   */
  onCreated: (req: PayloadRequest, shadow: Record<string, unknown>) => Promise<unknown>
  req: PayloadRequest
  /** Copies an exact logical source document instead of creating from data alone. */
  source?: ShadowSource
  /** Uses the request's existing transaction and leaves commit or rollback to its owner. */
  useAmbientTransaction?: boolean
}

const isShadowUniquenessError = (error: unknown): error is ValidationError =>
  error instanceof ValidationError &&
  error.data.errors.some(({ path }) =>
    path
      .split(',')
      .map((fieldPath) => fieldPath.trim())
      .some(
        (fieldPath) =>
          fieldPath === branchDocIDField ||
          fieldPath === '_branch_doc_id' ||
          fieldPath === '_branchdocid_id' ||
          fieldPath === 'documentID' ||
          fieldPath === branchField,
      ),
  )

const isTransientTransactionError = (error: unknown): boolean => {
  if (isUnknownTransactionCommitResult(error)) {
    return false
  }

  if (!error || typeof error !== 'object') {
    return false
  }

  const labeledError = error as {
    errorLabels?: string[]
    hasErrorLabel?: (label: string) => boolean
  }

  return (
    labeledError.hasErrorLabel?.('TransientTransactionError') === true ||
    labeledError.errorLabels?.includes('TransientTransactionError') === true
  )
}

export const isRecoverableConcurrentShadowError = (error: unknown): boolean =>
  isShadowUniquenessError(error) || isTransientTransactionError(error)

const concurrentShadowOperationErrors = new WeakSet<object>()

const markConcurrentShadowOperationError = (error: unknown): void => {
  if (error && typeof error === 'object') {
    concurrentShadowOperationErrors.add(error)
  }
}

export const isConcurrentShadowOperationError = (error: unknown): boolean =>
  Boolean(error && typeof error === 'object' && concurrentShadowOperationErrors.has(error))

const maximumConcurrentShadowAttempts = 8

export const waitForConcurrentShadowRetry = async ({
  retryIndex,
}: {
  retryIndex: number
}): Promise<void> => {
  const delayMilliseconds = Math.min(25 * 2 ** retryIndex, 100)

  await new Promise((resolve) => setTimeout(resolve, delayMilliseconds))
}

export const retryConcurrentShadowOperation = async <Result>({
  onRetry,
  operation,
  shouldRetry,
  waitForRetry = waitForConcurrentShadowRetry,
}: {
  onRetry?: (args: { error: unknown; retryIndex: number }) => Promise<void> | void
  operation: () => Promise<Result>
  shouldRetry: ((args: { error: unknown }) => boolean) | boolean
  waitForRetry?: (args: { retryIndex: number }) => Promise<void>
}): Promise<Result> => {
  for (let attemptIndex = 0; attemptIndex < maximumConcurrentShadowAttempts; attemptIndex++) {
    try {
      return await operation()
    } catch (error) {
      const hasAnotherAttempt = attemptIndex < maximumConcurrentShadowAttempts - 1
      const isRetryAllowed =
        typeof shouldRetry === 'function' ? shouldRetry({ error }) : shouldRetry

      if (!isRetryAllowed || !hasAnotherAttempt || !isRecoverableConcurrentShadowError(error)) {
        throw error
      }

      await onRetry?.({ error, retryIndex: attemptIndex })
      await waitForRetry({ retryIndex: attemptIndex })
    }
  }

  throw new Error('Concurrent shadow retry attempts were exhausted.')
}

export const findCompetingShadow = async ({
  branch,
  collectionSlug,
  docID,
  operation,
  req,
}: {
  branch: string
  collectionSlug: string
  docID: number | string
  operation?: BranchOperation
  req: PayloadRequest
}): Promise<null | Record<string, unknown>> => {
  // A caller transaction keeps its earlier snapshot and cannot observe the winner. Read without
  // that transaction, and allow a short bounded period for the winner to become visible.
  const recoveryReq = isolateObjectProperty(req, ['transactionID'])

  delete recoveryReq.transactionID

  for (let attemptIndex = 0; attemptIndex < maximumConcurrentShadowAttempts; attemptIndex++) {
    if (attemptIndex > 0) {
      await waitForConcurrentShadowRetry({ retryIndex: attemptIndex - 1 })
    }

    const winner = (await req.payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req: recoveryReq,
      where: {
        and: [{ [branchField]: { equals: branch } }, { [branchDocIDField]: { equals: docID } }],
      },
    })) as null | Record<string, unknown>

    if (winner) {
      const change = await req.payload.db.findOne({
        collection: branchChangesCollectionSlug,
        req: recoveryReq,
        where: {
          and: [
            { branch: { equals: branch } },
            { collectionSlug: { equals: collectionSlug } },
            { documentID: { equals: String(docID) } },
          ],
        },
      })

      if (!change) {
        if (attemptIndex < maximumConcurrentShadowAttempts - 1) {
          continue
        }

        throw new APIError(
          `The ${collectionSlug} branch row for document ${String(docID)} has no change record.`,
          409,
        )
      }

      const authoritativeOperation = (change as { operation?: BranchOperation }).operation

      if (operation && authoritativeOperation !== operation) {
        return null
      }

      return winner
    }
  }

  return null
}

/**
 * Creates a branch's shadow row for a document, safe against two concurrent
 * first-edits of the same document on the same branch racing to create it.
 *
 * The unique index on `(_branchDocID, _branch)` is what turns the losing side
 * into a rejection instead of a second, duplicate shadow row — but the create
 * runs in a transaction of its own, isolated from the caller's, rather than
 * the caller's ambient one. A losing race has to recover with a plain read,
 * and Postgres refuses any further command on a transaction once one
 * statement inside it fails — including that read — until it is rolled back.
 * A transaction of its own can be rolled back and moved past without
 * disturbing the write the caller is in the middle of.
 *
 * An operation that owns the request's existing transaction can opt into
 * creating the shadow and registry there instead. Errors on that path remain
 * with the operation owner, which can roll back and retry the full lifecycle.
 */
export const createShadowRow = async ({
  branch,
  collectionSlug,
  data,
  docID,
  onCreated,
  req,
  source,
  useAmbientTransaction = false,
}: Args): Promise<Record<string, unknown>> => {
  if (useAmbientTransaction) {
    const ambient = isolateObjectProperty(req, ['file'])
    const transactionID = await ambient.transactionID

    if (!transactionID) {
      throw new Error('Ambient shadow creation requires an active transaction.')
    }

    try {
      const shadow = await createShadowContent({
        branch,
        collectionSlug,
        data,
        req: ambient,
        source,
      })

      await onCreated(ambient, shadow)

      return shadow
    } catch (error) {
      if (isRecoverableConcurrentShadowError(error)) {
        markConcurrentShadowOperationError(error)
      }

      throw error
    }
  }

  // Registry writes use the same request so that they share the branch fork's transaction.
  // A nested Local API create clears `req.file` when no file is supplied, so isolate that
  // property as well or an upload replacement disappears before the real branch update runs.
  const isolated = isolateObjectProperty(req, ['file', 'transactionID'])

  delete isolated.transactionID

  const shouldCommit = await initTransaction(isolated)
  let shadow: Record<string, unknown>

  try {
    shadow = await createShadowContent({
      branch,
      collectionSlug,
      data,
      req: isolated,
      source,
    })
  } catch (error) {
    await killTransaction(isolated)

    if (!isRecoverableConcurrentShadowError(error)) {
      throw error
    }

    const winner = await findCompetingShadow({ branch, collectionSlug, docID, req })

    if (!winner) {
      markConcurrentShadowOperationError(error)
      throw error
    }

    return winner
  }

  try {
    await onCreated(isolated, shadow)

    if (shouldCommit) {
      await commitTransaction(isolated)
    }

    return shadow
  } catch (error) {
    await killTransaction(isolated)

    if (shouldCommit && isRecoverableConcurrentShadowError(error)) {
      const winner = await findCompetingShadow({ branch, collectionSlug, docID, req })

      if (winner) {
        return winner
      }

      markConcurrentShadowOperationError(error)
    }

    const shadowID = shadow.id

    if (!shouldCommit && (typeof shadowID === 'string' || typeof shadowID === 'number')) {
      try {
        await isolated.payload.db.deleteOne({
          branch: false,
          collection: collectionSlug,
          req: isolated,
          where: { id: { equals: shadowID } },
        })
      } catch {
        // The callback error remains the reason this operation failed.
      }
    }

    throw error
  }
}

const createShadowContent = async ({
  branch,
  collectionSlug,
  data,
  req,
  source,
}: {
  branch: string
  collectionSlug: string
  data: Record<string, unknown>
  req: PayloadRequest
  source?: ShadowSource
}): Promise<Record<string, unknown>> => {
  if (source) {
    return req.payload.db.copy({
      collection: collectionSlug,
      data: {
        ...data,
        [branchDocIDField]: source.id,
        [branchField]: branch,
      },
      req,
      where: {
        and: [
          { [branchField]: { equals: source.branch } },
          {
            or: [{ id: { equals: source.id } }, { [branchDocIDField]: { equals: source.id } }],
          },
        ],
      },
    }) as Promise<Record<string, unknown>>
  }

  return req.payload.db.create({
    collection: collectionSlug,
    data,
    req,
  }) as Promise<Record<string, unknown>>
}
