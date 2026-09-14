import type { CollectionConfig, PayloadRequest, UploadConfig } from 'payload'

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
 * A verified `clientUploadContext` is used directly. Otherwise the document is resolved with
 * `overrideAccess: false`, any query-param prefix only narrows that lookup, and `_objectKey` is
 * read from the resolved document via `showHiddenFields`.
 */
export async function getFilePrefix({
  clientUploadContext,
  collection,
  filename,
  prefixQueryParam,
  req,
}: {
  clientUploadContext?: unknown
  collection: CollectionConfig
  filename: string
  prefixQueryParam?: string
  req: PayloadRequest
}): Promise<string> {
  // Verified client-upload context (server-issued receipt) takes precedence.
  if (
    clientUploadContext &&
    typeof clientUploadContext === 'object' &&
    'prefix' in clientUploadContext &&
    typeof clientUploadContext.prefix === 'string'
  ) {
    const contextObjectKey =
      '_objectKey' in clientUploadContext
        ? (clientUploadContext as { _objectKey?: unknown })._objectKey
        : undefined
    return joinObjectFolder(clientUploadContext.prefix, contextObjectKey)
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

  const doc = files?.docs?.[0]
  return joinObjectFolder(doc?.prefix, (doc as { _objectKey?: unknown })?._objectKey)
}
