import type { PayloadRequest } from '../types/index.js'

import { ValidationError } from '../errors/ValidationError.js'
import { commitTransaction } from '../utilities/commitTransaction.js'
import { initTransaction } from '../utilities/initTransaction.js'
import { isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
import { killTransaction } from '../utilities/killTransaction.js'
import { branchDocIDField, branchField } from './types.js'

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
  /** Uses the request's existing transaction and leaves commit or rollback to its owner. */
  useAmbientTransaction?: boolean
}

const isShadowUniquenessError = (error: unknown): error is ValidationError =>
  error instanceof ValidationError &&
  error.data.errors.some(
    ({ path }) => path === branchDocIDField || path === '_branch_doc_id' || path === branchField,
  )

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
 * creating the shadow and registry there instead. That path leaves all error
 * handling to the transaction owner and does not attempt race recovery.
 */
export const createShadowRow = async ({
  branch,
  collectionSlug,
  data,
  docID,
  onCreated,
  req,
  useAmbientTransaction = false,
}: Args): Promise<Record<string, unknown>> => {
  if (useAmbientTransaction) {
    const ambient = isolateObjectProperty(req, ['file'])
    const transactionID = await ambient.transactionID

    if (!transactionID) {
      throw new Error('Ambient shadow creation requires an active transaction.')
    }

    const shadow = (await ambient.payload.db.create({
      collection: collectionSlug,
      data,
      req: ambient,
    })) as Record<string, unknown>

    await onCreated(ambient, shadow)

    return shadow
  }

  // Registry writes use the same request so that they share the branch fork's transaction.
  // A nested Local API create clears `req.file` when no file is supplied, so isolate that
  // property as well or an upload replacement disappears before the real branch update runs.
  const isolated = isolateObjectProperty(req, ['file', 'transactionID'])

  delete isolated.transactionID

  const shouldCommit = await initTransaction(isolated)
  let shadow: Record<string, unknown>

  try {
    shadow = (await isolated.payload.db.create({
      collection: collectionSlug,
      data,
      req: isolated,
    })) as Record<string, unknown>
  } catch (error) {
    await killTransaction(isolated)

    if (!isShadowUniquenessError(error)) {
      throw error
    }

    // On MongoDB, an in-progress transaction's write is invisible to a plain read
    // until it commits, and the loser's own conflict can surface before that commit
    // lands — unlike Postgres, which blocks the losing insert until the winner's
    // transaction resolves. A few short retries cover that gap without turning a
    // genuine failure into an indefinite wait.
    let winner: null | Record<string, unknown> = null

    for (let attempt = 0; !winner && attempt < 5; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      winner = (await req.payload.db.findOne({
        branch: false,
        collection: collectionSlug,
        req,
        where: {
          and: [{ [branchField]: { equals: branch } }, { [branchDocIDField]: { equals: docID } }],
        },
      })) as null | Record<string, unknown>
    }

    if (!winner) {
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
