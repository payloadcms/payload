import type { TypeWithID } from '../collections/config/types.js'
import type { PaginatedDocs } from '../database/types.js'
import type { JsonObject, PayloadRequest, Where } from '../types/index.js'

import { Locked } from '../errors/index.js'
import { lockedDocumentsCollectionSlug } from '../locked-documents/config.js'

type CheckDocumentLockStatusArgs = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  lockDurationDefault?: number
  lockErrorMessage?: string
  overrideLock?: boolean
  req: PayloadRequest
}

export const checkDocumentLockStatus = async ({
  id,
  collectionSlug,
  globalSlug,
  lockDurationDefault = 300, // Default 5 minutes in seconds
  lockErrorMessage,
  overrideLock = true,
  req,
}: CheckDocumentLockStatusArgs): Promise<void> => {
  const { payload } = req

  // Check if the locked-documents collection exists
  if (!payload.collections?.[lockedDocumentsCollectionSlug]) {
    // If the collection doesn't exist, locking is not available
    return
  }

  // Retrieve the lockDocuments property for either collection or global
  const lockDocumentsProp = collectionSlug
    ? payload.collections?.[collectionSlug]?.config?.lockDocuments
    : payload.config?.globals?.find((g) => g.slug === globalSlug)?.lockDocuments

  const isLockingEnabled = lockDocumentsProp !== false

  let lockedDocumentQuery = {}

  if (collectionSlug) {
    lockedDocumentQuery = {
      and: [
        { 'document.relationTo': { equals: collectionSlug } },
        { 'document.value': { equals: id } },
      ],
    }
  } else if (globalSlug) {
    lockedDocumentQuery = { globalSlug: { equals: globalSlug } }
  } else {
    throw new Error('Either collectionSlug or globalSlug must be provided.')
  }

  if (!isLockingEnabled) {
    return
  }

  // Only perform lock checks if overrideLock is false and locking is enabled
  if (!overrideLock) {
    const defaultLockErrorMessage = collectionSlug
      ? `Document with ID ${id} is currently locked by another user and cannot be modified.`
      : `Global document with slug "${globalSlug}" is currently locked by another user and cannot be modified.`

    const finalLockErrorMessage = lockErrorMessage || defaultLockErrorMessage

    const lockedDocumentResult: PaginatedDocs<JsonObject & TypeWithID> = await payload.db.find({
      collection: lockedDocumentsCollectionSlug,
      limit: 1,
      pagination: false,
      sort: '-updatedAt',
      where: lockedDocumentQuery,
    })

    // If there's a locked document, check lock conditions
    const lockedDoc = lockedDocumentResult?.docs[0]
    if (lockedDoc) {
      const lastEditedAt = new Date(lockedDoc?.updatedAt).getTime()
      const now = new Date().getTime()

      const lockDuration =
        typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault

      const lockDurationInMilliseconds = lockDuration * 1000
      const currentUserId = req.user?.id

      // document is locked by another user and the lock hasn't expired
      if (
        lockedDoc.user?.value !== currentUserId &&
        now - lastEditedAt <= lockDurationInMilliseconds
      ) {
        throw new Locked(finalLockErrorMessage)
      }
    }
  }

  // Perform the delete operation regardless of overrideLock status
  await payload.db.deleteMany({
    collection: lockedDocumentsCollectionSlug,
    // Not passing req fails on postgres
    req: payload.db.name === 'mongoose' ? undefined : req,
    where: lockedDocumentQuery,
  })
}

type BulkLockArgs = {
  collectionSlug: string
  ids: (number | string)[]
  req: PayloadRequest
}

type DocumentLockState = {
  lockDocumentIDsByDocumentID: Map<string, (number | string)[]>
  lockedDocumentIDs: Set<string>
}

type GetDocumentLockStateArgs = {
  lockDurationDefault?: number
  overrideLock?: boolean
} & BulkLockArgs

const buildBulkLockedDocumentQuery = (collectionSlug: string, ids: (number | string)[]): Where => ({
  and: [{ 'document.relationTo': { equals: collectionSlug } }, { 'document.value': { in: ids } }],
})

const isLockingAvailable = (collectionSlug: string, req: PayloadRequest): boolean => {
  const { payload } = req

  if (!payload.collections?.[lockedDocumentsCollectionSlug]) {
    return false
  }

  return payload.collections?.[collectionSlug]?.config?.lockDocuments !== false
}

/**
 * Batched counterpart to `checkDocumentLockStatus`. Resolves the lock state of every id with a
 * single query instead of one per document, and returns the ids that are locked by another user.
 * Callers are expected to report those ids as errors and leave them alone.
 */
export const getDocumentLockState = async ({
  collectionSlug,
  ids,
  lockDurationDefault = 300, // Default 5 minutes in seconds
  overrideLock = true,
  req,
}: GetDocumentLockStateArgs): Promise<DocumentLockState> => {
  const lockState: DocumentLockState = {
    lockDocumentIDsByDocumentID: new Map<string, (number | string)[]>(),
    lockedDocumentIDs: new Set<string>(),
  }

  if (!ids.length || !isLockingAvailable(collectionSlug, req)) {
    return lockState
  }

  const { payload } = req
  const lockDocumentsProp = payload.collections?.[collectionSlug]?.config?.lockDocuments

  const lockedDocumentResult: PaginatedDocs<JsonObject & TypeWithID> = await payload.db.find({
    collection: lockedDocumentsCollectionSlug,
    limit: 0,
    pagination: false,
    sort: '-updatedAt',
    where: buildBulkLockedDocumentQuery(collectionSlug, ids),
  })

  const lockDuration =
    typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault

  const lockDurationInMilliseconds = lockDuration * 1000
  const currentUserId = req.user?.id
  const now = new Date().getTime()
  const resolved = new Set<string>()

  for (const lockedDoc of lockedDocumentResult?.docs ?? []) {
    const documentId = String(lockedDoc.document?.value)
    const lockDocumentIDs = lockState.lockDocumentIDsByDocumentID.get(documentId)

    if (lockDocumentIDs) {
      lockDocumentIDs.push(lockedDoc.id)
    } else {
      lockState.lockDocumentIDsByDocumentID.set(documentId, [lockedDoc.id])
    }

    // Sorted by -updatedAt, so the first row seen for an id is its most recent lock
    if (resolved.has(documentId)) {
      continue
    }
    resolved.add(documentId)

    const lastEditedAt = new Date(lockedDoc?.updatedAt).getTime()

    // document is locked by another user and the lock hasn't expired
    if (
      !overrideLock &&
      lockedDoc.user?.value !== currentUserId &&
      now - lastEditedAt <= lockDurationInMilliseconds
    ) {
      lockState.lockedDocumentIDs.add(documentId)
    }
  }

  return lockState
}

export const getLockedDocumentIds = async (
  args: GetDocumentLockStateArgs,
): Promise<Set<string>> => {
  if (args.overrideLock ?? true) {
    return new Set<string>()
  }

  return (await getDocumentLockState(args)).lockedDocumentIDs
}

/**
 * Batched counterpart to the lock cleanup `checkDocumentLockStatus` performs, so that bulk
 * operations release every lock in one query instead of one per document.
 */
export const deleteDocumentLocks = async ({
  collectionSlug,
  ids,
  lockDocumentIDs,
  req,
}: { lockDocumentIDs?: (number | string)[] } & BulkLockArgs): Promise<void> => {
  const { payload } = req

  if (
    !ids.length ||
    (lockDocumentIDs && !lockDocumentIDs.length) ||
    !isLockingAvailable(collectionSlug, req)
  ) {
    return
  }

  await payload.db.deleteMany({
    collection: lockedDocumentsCollectionSlug,
    // Not passing req fails on postgres
    req: payload.db.name === 'mongoose' ? undefined : req,
    where: lockDocumentIDs
      ? { id: { in: lockDocumentIDs } }
      : buildBulkLockedDocumentQuery(collectionSlug, ids),
  })
}
