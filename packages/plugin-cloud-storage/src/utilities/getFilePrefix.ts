import type { CollectionConfig, PayloadRequest, TypeWithID, UploadConfig } from 'payload'

import { buildPrefixWithObjectKey } from './buildPrefixWithObjectKey.js'
import { buildUploadStoragePathData } from './buildStoragePathData.js'
import { sanitizePrefix } from './sanitizePrefix.js'

/**
 * Resolves the folder a stored object lives under (semantic `prefix` plus `_objectKey`).
 *
 * An already-authorized `doc` wins outright. Otherwise an `uploadReference` is used (its
 * `prefix` re-contained with {@link buildUploadStoragePathData}, since it hasn't been verified against
 * a signed receipt by every adapter). Otherwise the document is resolved with
 * `overrideAccess: false`, any query-param prefix only narrows that lookup, and `_objectKey`
 * is read from the resolved document via `showHiddenFields`.
 */
export async function getFilePrefix({
  collection,
  collectionPrefix,
  doc,
  filename,
  prefixQueryParam,
  req,
  uploadReference,
  useCompositePrefixes = false,
}: {
  collection: CollectionConfig
  collectionPrefix?: string
  doc?: { _objectKey?: string; prefix?: string } & TypeWithID
  filename: string
  /**
   * Only narrows the access-controlled fallback lookup below; never trusted or
   * returned directly. Prefer passing the access-checked document as `doc` instead.
   */
  prefixQueryParam?: string
  req: PayloadRequest
  uploadReference?: unknown
  useCompositePrefixes?: boolean
}): Promise<string> {
  // The serve path already loaded and authorized this document — trust it over any
  // client-supplied upload reference or query prefix.
  if (doc) {
    return buildPrefixWithObjectKey({ objectKey: doc._objectKey, prefix: doc.prefix })
  }

  // Upload instructions call handlers without a document yet. Re-contain the claimed
  // prefix — it hasn't been verified against a signed receipt by every adapter.
  if (
    uploadReference &&
    typeof uploadReference === 'object' &&
    'prefix' in uploadReference &&
    typeof uploadReference.prefix === 'string'
  ) {
    const referenceObjectKey =
      '_objectKey' in uploadReference
        ? (uploadReference as { _objectKey?: string })._objectKey
        : undefined
    const containedPrefix = buildUploadStoragePathData({
      collectionPrefix,
      docPrefix: uploadReference.prefix,
      filename,
      useCompositePrefixes,
    }).sanitizedDocPrefix
    return buildPrefixWithObjectKey({ objectKey: referenceObjectKey, prefix: containedPrefix })
  }

  // Reads without a query prefix or read-access constraints skip the endpoint's document lookup.
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

  const found = files?.docs?.[0] as { _objectKey?: string; prefix?: string } | undefined
  return buildPrefixWithObjectKey({ objectKey: found?._objectKey, prefix: found?.prefix })
}
