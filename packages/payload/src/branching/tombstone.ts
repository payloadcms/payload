import type { PayloadRequest, Where } from '../types/index.js'

import { APIError } from '../errors/index.js'
import { extractRelationshipID } from '../utilities/extractRelationshipID.js'
import { httpStatus } from '../utilities/httpStatus.js'
import { isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
import { assertBranchCreatedDocumentsUnreferenced } from './assertBranchCreatedDocumentsUnreferenced.js'
import { assertBranchWritable } from './assertBranchWritable.js'
import { copyUploadFilesToBranch } from './copyUploadFilesToBranch.js'
import { createShadowRow } from './createShadowRow.js'
import {
  loadBranchOperation,
  peekBranchOperation,
  resetBranchState,
  resolveBranch,
} from './resolveBranch.js'
import { resolveBranchQuery } from './resolveBranchQuery.js'
import { branchChangesCollectionSlug, branchDocIDField, branchField, MAIN_BRANCH } from './types.js'
import { findBranchVersionForkBoundary } from './versions.js'

type Args = {
  branch?: false | string
  collectionSlug: string
  req?: Partial<PayloadRequest>
  where: undefined | Where
}

type ConcurrentBranchDelete = {
  branch: string
  collectionSlug: string
  doc: Record<string, unknown>
  docID: number | string
  retryError: unknown
  winnerID: number | string
}

export type BranchDeleteOutcome = {
  doc: Record<string, unknown>
  tombstoned: boolean
}

type BranchDeleteOperation = {
  branch: string
  collectionSlug: string
  docID: number | string
  isTombstoneExpected: boolean
  onResolved: (outcome: BranchDeleteOutcome) => void
  useAmbientTransaction: boolean
}

const concurrentBranchDeleteContextKey = Symbol.for('payload.branching.concurrentBranchDelete')

const branchDeleteOperationContextKey = Symbol.for('payload.branching.branchDeleteOperation')

type Result = {
  /** Narrows the caller's delete to this row's primary key. */
  deleteRowID?: number | string
  /** The document to report as deleted, when the delete was absorbed. */
  doc?: Record<string, unknown>
  /** True when the delete became a tombstone and must not proceed. */
  tombstoned: boolean
}

const createBranchDeleteChangedError = (): APIError =>
  new APIError(
    'The branch document changed while it was being deleted. Retry the operation.',
    httpStatus.CONFLICT,
  )

/**
 * Checks a branch-created document before delete hooks and cascades can cause
 * effects that a database rollback cannot restore.
 */
export const assertBranchCreatedDeleteUnreferenced = async ({
  branch: branchOverride,
  collectionSlug,
  doc,
  req,
}: {
  branch?: false | string
  collectionSlug: string
  doc: null | Record<string, unknown> | undefined
  req?: Partial<PayloadRequest>
}): Promise<null | Record<string, unknown>> => {
  if (!doc) {
    return null
  }

  if (branchOverride === false || !req?.payload) {
    return doc
  }

  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return doc
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return doc
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    return doc
  }

  const branchDocument = (await req.payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: {
      and: [{ id: { equals: doc.id as number | string } }, { [branchField]: { equals: branch } }],
    },
  })) as null | Record<string, unknown>

  if (
    !branchDocument ||
    (await loadBranchOperation({
      collectionSlug,
      docID: branchDocument.id as number | string,
      req: req as PayloadRequest,
    })) !== 'create'
  ) {
    return doc
  }

  const targetID = branchDocument.id as number | string

  await assertBranchCreatedDocumentsUnreferenced({
    ignoredOwnerRowIDs: new Map([[collectionSlug, new Set([targetID])]]),
    req: req as PayloadRequest,
    targets: [{ collectionSlug, docID: targetID }],
  })

  return branchDocument
}

/**
 * Turns a delete on a branch into a tombstone against main.
 *
 * A branch cannot delete production content, so deleting a main document from
 * a branch records the intent in its authoritative change record. The read
 * predicate hides the matching canonical ID on that branch and nowhere else.
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

  const requestContext = req.context as Record<PropertyKey, unknown> | undefined
  const branchDeleteOperation = requestContext?.[branchDeleteOperationContextKey] as
    | BranchDeleteOperation
    | undefined
  const requestedDocID = (where?.id as { equals?: unknown })?.equals
  const matchingBranchDeleteOperation =
    branchDeleteOperation?.branch === branch &&
    branchDeleteOperation.collectionSlug === collectionSlug &&
    String(branchDeleteOperation.docID) === String(requestedDocID)
      ? branchDeleteOperation
      : undefined
  const useAmbientTransaction = matchingBranchDeleteOperation?.useAmbientTransaction === true

  delete requestContext?.[branchDeleteOperationContextKey]

  // A delete is a write like any other, and a closed branch takes none. Consume the operation
  // markers first so a failed validation cannot affect another delete on the same request.
  await assertBranchWritable({ branch, req: req as PayloadRequest })

  const concurrentDelete = requestContext?.[concurrentBranchDeleteContextKey] as
    | ConcurrentBranchDelete
    | undefined

  if (
    concurrentDelete?.branch === branch &&
    concurrentDelete.collectionSlug === collectionSlug &&
    String(concurrentDelete.docID) === String((where?.id as { equals?: unknown })?.equals)
  ) {
    delete requestContext?.[concurrentBranchDeleteContextKey]

    const latestCommittedReq = isolateObjectProperty(req as PayloadRequest, ['transactionID'])

    delete latestCommittedReq.transactionID

    const matchingWinner = await req.payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req: latestCommittedReq,
      where: {
        and: [
          { id: { equals: concurrentDelete.winnerID } },
          { [branchField]: { equals: branch } },
          { [branchDocIDField]: { equals: concurrentDelete.docID } },
        ],
      },
    })
    const matchingWinnerChange = matchingWinner
      ? await req.payload.db.findOne({
          collection: branchChangesCollectionSlug,
          req: latestCommittedReq,
          where: {
            and: [
              { branch: { equals: branch } },
              { collectionSlug: { equals: collectionSlug } },
              { documentID: { equals: String(concurrentDelete.docID) } },
              { operation: { equals: 'delete' } },
            ],
          },
        })
      : null

    if (matchingWinner && matchingWinnerChange) {
      const outcome = {
        doc: { ...matchingWinner, id: concurrentDelete.docID },
        tombstoned: true,
      }

      if (matchingBranchDeleteOperation) {
        if (!matchingBranchDeleteOperation.isTombstoneExpected) {
          resetBranchState(req as PayloadRequest)
          throw createBranchDeleteChangedError()
        }

        matchingBranchDeleteOperation.onResolved(outcome)
      }

      resetBranchState(req as PayloadRequest)

      return outcome
    }

    throw concurrentDelete.retryError
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
    resetBranchState(req as PayloadRequest)
    throw createBranchDeleteChangedError()
  }

  const targetID = target.id as number | string
  const isOnThisBranch = target[branchField] === branch
  const canonicalID = extractRelationshipID({ relationship: target[branchDocIDField] }) ?? targetID
  const operation = peekBranchOperation({ collectionSlug, docID: canonicalID, req })
  const isTombstoneExpectedForTarget = !(isOnThisBranch && operation === 'create')

  if (
    matchingBranchDeleteOperation &&
    matchingBranchDeleteOperation.isTombstoneExpected !== isTombstoneExpectedForTarget
  ) {
    resetBranchState(req as PayloadRequest)
    throw createBranchDeleteChangedError()
  }

  if (req.transactionID && !useAmbientTransaction && !isOnThisBranch) {
    resetBranchState(req as PayloadRequest)
    throw new APIError(
      'Cannot delete an untouched branch document within an existing transaction.',
      httpStatus.CONFLICT,
    )
  }

  if (isOnThisBranch && !operation) {
    throw new APIError(
      `The ${collectionSlug} branch row for document ${String(canonicalID)} has no change record.`,
      409,
    )
  }

  // Created on this branch: no main row stands behind it, so a real delete
  // leaves nothing to hide.
  if (isOnThisBranch && operation === 'create') {
    await assertBranchCreatedDeleteUnreferenced({
      branch,
      collectionSlug,
      doc: target,
      req: req as PayloadRequest,
    })

    if (req.transactionID) {
      const latestCommittedReq = isolateObjectProperty(req as PayloadRequest, ['transactionID'])

      delete latestCommittedReq.transactionID

      await assertBranchCreatedDocumentsUnreferenced({
        ignoredOwnerRowIDs: new Map([[collectionSlug, new Set([targetID])]]),
        req: latestCommittedReq,
        targets: [{ collectionSlug, docID: targetID }],
      })
    }

    await req.payload.db.deleteMany({
      collection: branchChangesCollectionSlug,
      req,
      where: { and: [{ branch: { equals: branch } }, { 'doc.value': { equals: targetID } }] },
    })

    matchingBranchDeleteOperation?.onResolved({ doc: target, tombstoned: false })

    resetBranchState(req as PayloadRequest)

    return { deleteRowID: targetID, tombstoned: false }
  }

  let deletedDocument = target

  if (isOnThisBranch) {
    const previousBranchChange = (await req.payload.db.findOne({
      collection: branchChangesCollectionSlug,
      req,
      where: {
        and: [
          { branch: { equals: branch } },
          { collectionSlug: { equals: collectionSlug } },
          { documentID: { equals: String(canonicalID) } },
        ],
      },
    })) as null | Record<string, unknown>

    await req.payload.db.deleteMany({
      collection: branchChangesCollectionSlug,
      req,
      where: { and: [{ branch: { equals: branch } }, { 'doc.value': { equals: canonicalID } }] },
    })

    await req.payload.create({
      collection: branchChangesCollectionSlug,
      data: {
        baseUpdatedAt: previousBranchChange?.baseUpdatedAt,
        baseVersionID: previousBranchChange?.baseVersionID,
        baseVersionUpdatedAt: previousBranchChange?.baseVersionUpdatedAt,
        branch,
        collectionSlug,
        doc: { relationTo: collectionSlug, value: canonicalID },
        documentID: String(canonicalID),
        entityType: 'collection',
        operation: 'delete',
      },
      overrideAccess: true,
      req,
    })
  } else {
    const { id: _discardedID, ...data } = target
    let copiedShadow: Record<string, unknown> | undefined

    const shadow = await createShadowRow({
      branch,
      collectionSlug,
      data: {
        ...data,
        [branchDocIDField]: canonicalID,
        [branchField]: branch,
      },
      docID: canonicalID,
      onCreated: async (createReq, createdShadow) => {
        const collection = createReq.payload.collections[collectionSlug]

        copiedShadow = collection?.config.upload
          ? await copyUploadFilesToBranch({
              branch,
              collection: collection.config,
              doc: createdShadow,
              req: createReq,
            })
          : createdShadow

        const versionBoundary = await findBranchVersionForkBoundary({
          collectionSlug,
          docID: canonicalID,
          req: createReq,
        })

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
            baseUpdatedAt: target.updatedAt,
            ...versionBoundary,
            branch,
            collectionSlug,
            doc: { relationTo: collectionSlug, value: canonicalID },
            documentID: String(canonicalID),
            entityType: 'collection',
            operation: 'delete',
          },
          overrideAccess: true,
          req: createReq,
        })
      },
      req: req as PayloadRequest,
      useAmbientTransaction,
    })

    deletedDocument = copiedShadow ?? shadow
  }

  matchingBranchDeleteOperation?.onResolved({
    doc: isTombstoneExpectedForTarget ? { ...deletedDocument, id: canonicalID } : deletedDocument,
    tombstoned: isTombstoneExpectedForTarget,
  })

  resetBranchState(req as PayloadRequest)
  ;(req as PayloadRequest).branch = branch

  return { doc: { ...target, id: canonicalID }, tombstoned: true }
}
