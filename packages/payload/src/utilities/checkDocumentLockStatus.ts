import type { TypeWithID } from '../collections/config/types.js'
import type { PaginatedDocs } from '../database/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'

type CheckDocumentLockStatusArgs = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  lockDurationDefault?: number
  lockErrorMessage?: string
  req: PayloadRequest
}

export const checkDocumentLockStatus = async ({
  id,
  collectionSlug,
  globalSlug,
  lockDurationDefault = 300, // Default 5 minutes in seconds
  lockErrorMessage,
  req,
}: CheckDocumentLockStatusArgs): Promise<void> => {
  const { payload } = req

  // Retrieve the lockDocuments property for either collection or global
  const lockDocumentsProp = collectionSlug
    ? payload.config?.collections?.find((c) => c.slug === collectionSlug)?.lockDocuments
    : payload.config?.globals?.find((g) => g.slug === globalSlug)?.lockDocuments

  const isLockingEnabled = lockDocumentsProp !== false

  // If lockDocuments is explicitly set to false, skip the lock logic and return early
  if (isLockingEnabled === false) {
    return { lockedDocument: undefined, shouldUnlockDocument: false }
  }

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

  const defaultLockErrorMessage = collectionSlug
    ? `Document with ID ${id} is currently locked by another user and cannot be modified.`
    : `Global document with slug "${globalSlug}" is currently locked by another user and cannot be modified.`

  const finalLockErrorMessage = lockErrorMessage || defaultLockErrorMessage

  const lockedDocumentResult: PaginatedDocs<JsonObject & TypeWithID> = await payload.find({
    collection: 'payload-locked-documents',
    depth: 1,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: lockedDocumentQuery,
  })

  // If there's a locked document, check lock conditions
  const lockedDoc = lockedDocumentResult?.docs[0]
  if (!lockedDoc) {
    return
  }

  const lastEditedAt = new Date(lockedDoc?.updatedAt)
  const now = new Date()

  const lockDuration =
    typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault

  const lockDurationInMilliseconds = lockDuration * 1000
  const currentUserId = req.user?.id

  // document is locked by another user and the lock hasn't expired
  if (
    lockedDoc.user?.value?.id !== currentUserId &&
    now.getTime() - lastEditedAt.getTime() <= lockDurationInMilliseconds
  ) {
    throw new APIError(finalLockErrorMessage)
  }

  await payload.db.deleteMany({
    collection: 'payload-locked-documents',
    req,
    where: lockedDocumentQuery,
  })
}
