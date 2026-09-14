import type { CollectionConfig, PayloadRequest, TypeWithID, UploadConfig } from 'payload'

import { sanitizePrefix } from './sanitizePrefix.js'

// Joins the semantic prefix and the `_objectKey` segment into the object's folder; either may be empty.
const joinObjectFolder = (prefix: unknown, objectKey: unknown): string => {
  const safePrefix = sanitizePrefix(typeof prefix === 'string' ? prefix : '')
  const safeObjectKey = sanitizePrefix(typeof objectKey === 'string' ? objectKey : '')

  if (safePrefix && safeObjectKey) {
    return `${safePrefix}/${safeObjectKey}`
  }

  return safePrefix || safeObjectKey
}

/**
 * Resolves the folder a stored object lives under (semantic `prefix` plus `_objectKey`).
 *
 * A verified `uploadReference` or an already-authorized `doc` is used directly. Otherwise the
 * document is resolved with `overrideAccess: false`, any query-param prefix only narrows that
 * lookup, and `_objectKey` is read from the resolved document via `showHiddenFields`.
 */
export async function getFilePrefix({
  collection,
  doc,
  filename,
  prefixQueryParam,
  req,
  uploadReference,
}: {
  collection: CollectionConfig
  doc?: { _objectKey?: string; prefix?: string } & TypeWithID
  filename: string
  prefixQueryParam?: string
  req: PayloadRequest
  uploadReference?: unknown
}): Promise<string> {
  // Verified upload reference (server-issued receipt) takes precedence.
  if (
    uploadReference &&
    typeof uploadReference === 'object' &&
    'prefix' in uploadReference &&
    typeof uploadReference.prefix === 'string'
  ) {
    const referenceObjectKey =
      '_objectKey' in uploadReference
        ? (uploadReference as { _objectKey?: unknown })._objectKey
        : undefined
    return joinObjectFolder(uploadReference.prefix, referenceObjectKey)
  }

  // The serve path already loaded and authorized this document.
  if (doc) {
    return joinObjectFolder(doc.prefix, doc._objectKey)
  }

  const imageSizes = (collection?.upload as UploadConfig)?.imageSizes || []

  const filenameClause = {
    or: [
      {
        filename: { equals: filename },
      },
      ...imageSizes.map((imageSize) => ({
        [`sizes.${imageSize.name}.filename`]: { equals: filename },
      })),
    ],
  }

  // Only filter by prefix when the collection persists a `prefix` field (querying a missing field throws).
  const hasPrefixField = collection.fields?.some(
    (field) => 'name' in field && field.name === 'prefix',
  )
  const where =
    typeof prefixQueryParam === 'string' && hasPrefixField
      ? { and: [filenameClause, { prefix: { equals: sanitizePrefix(prefixQueryParam) } }] }
      : filenameClause

  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: true,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req,
    select: {
      _objectKey: true,
      prefix: true,
    },
    showHiddenFields: true,
    where,
  })

  const found = files?.docs?.[0]
  return joinObjectFolder(found?.prefix, (found as { _objectKey?: unknown })?._objectKey)
}
