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

type CheckDocumentLockResult = {
  lockedDocument?: JsonObject & TypeWithID
  shouldUnlockDocument: boolean
}

export const checkDocumentLockStatus = async ({
  id,
  collectionSlug,
  globalSlug,
  lockDurationDefault = 300, // Default 5 minutes in seconds
  lockErrorMessage,
  req,
}: CheckDocumentLockStatusArgs): Promise<CheckDocumentLockResult> => {
  const { payload } = req

  // Retrieve the lockWhenEditing property for either collection or global
  const lockWhenEditingProp = collectionSlug
    ? payload.config?.collections?.find((c) => c.slug === collectionSlug)?.lockWhenEditing
    : payload.config?.globals?.find((g) => g.slug === globalSlug)?.lockWhenEditing

  const isLockingEnabled = lockWhenEditingProp !== undefined ? lockWhenEditingProp : true

  // If lockWhenEditing is explicitly set to false, skip the lock logic and return early
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
    where: lockedDocumentQuery,
  })

  let shouldUnlockDocument = false

  // If there's a locked document, check lock conditions
  if (lockedDocumentResult.docs.length > 0) {
    const lockedDoc = lockedDocumentResult.docs[0]
    const lastEditedAt = new Date(lockedDoc?._lastEdited?.editedAt)
    const now = new Date()

    const lockDuration =
      typeof lockWhenEditingProp === 'object' && 'lockDuration' in lockWhenEditingProp
        ? lockWhenEditingProp.lockDuration
        : lockDurationDefault

    const lockDurationInMilliseconds = lockDuration * 1000
    const currentUserId = req.user?.id

    // If document is locked by another user and the lock hasn't expired
    if (lockedDoc._lastEdited?.user?.value?.id !== currentUserId) {
      if (now.getTime() - lastEditedAt.getTime() <= lockDurationInMilliseconds) {
        throw new APIError(finalLockErrorMessage)
      } else {
        // If lock has expired, allow unlocking
        shouldUnlockDocument = true
      }
    } else {
      // If document is locked by the current user, allow unlocking
      shouldUnlockDocument = true
    }
  }

  return { lockedDocument: lockedDocumentResult.docs[0], shouldUnlockDocument }
}
