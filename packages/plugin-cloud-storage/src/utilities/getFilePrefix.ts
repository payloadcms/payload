import type { CollectionConfig, PayloadRequest, TypeWithID, UploadConfig } from 'payload'

import { buildPrefixWithObjectKey } from './buildPrefixWithObjectKey.js'
import { buildStoragePathData, buildUploadStoragePathData } from './buildStoragePathData.js'
import { sanitizePrefix } from './sanitizePrefix.js'

/**
 * Resolves the folder a stored object lives under (semantic `prefix` plus `_objectKey`).
 *
 * An already-authorized `doc` wins outright. Otherwise a verified `clientUploadContext` is used
 * (its `prefix` re-contained with {@link buildUploadStoragePathData}, since it hasn't been verified against
 * a signed receipt by every adapter). Otherwise the document is resolved with
 * `overrideAccess: false`, any query-param prefix only narrows that lookup, and `_objectKey` is
 * read from the resolved document.
 */

type GetFilePrefixArgs = {
  clientUploadContext?: unknown
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
  useCompositePrefixes?: boolean
}
export async function getFilePrefix({
  clientUploadContext,
  collection,
  collectionPrefix,
  doc,
  filename,
  prefixQueryParam,
  req,
  useCompositePrefixes = false,
}: GetFilePrefixArgs): Promise<string> {
  // The serve path already loaded and authorized this document — trust it over any
  // client-supplied upload context or query prefix.
  if (doc) {
    return buildPrefixWithObjectKey({ objectKey: doc._objectKey, prefix: doc.prefix })
  }

  // Client uploads call handlers without a document yet. Re-contain the claimed
  // prefix — it hasn't been verified against a signed receipt by every adapter.
  if (
    clientUploadContext &&
    typeof clientUploadContext === 'object' &&
    'prefix' in clientUploadContext &&
    typeof clientUploadContext.prefix === 'string'
  ) {
    const contextObjectKey: string | undefined =
      '_objectKey' in clientUploadContext
        ? ((clientUploadContext as { _objectKey?: unknown })._objectKey as string)
        : undefined
    const containedPrefix = buildUploadStoragePathData({
      collectionPrefix,
      docPrefix: clientUploadContext.prefix,
      filename,
      useCompositePrefixes,
    }).sanitizedDocPrefix
    return buildPrefixWithObjectKey({
      objectKey: contextObjectKey,
      prefix: containedPrefix,
    })
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
    where,
  })

  const found = files?.docs?.[0] as { _objectKey?: string; prefix?: string } | undefined
  return buildPrefixWithObjectKey({ objectKey: found?._objectKey, prefix: found?.prefix })
}

/**
 * Serve-path helper: resolves the authorized folder with {@link getFilePrefix}, then returns the
 * full object key via {@link buildStoragePathData}. Read handlers use this so a key is never built from an
 * unresolved prefix.
 */
export async function getStorageFilePath(args: GetFilePrefixArgs): Promise<string> {
  const docPrefix = await getFilePrefix(args)

  return buildStoragePathData({
    collectionPrefix: args.collectionPrefix,
    docPrefix,
    filename: args.filename,
    useCompositePrefixes: args.useCompositePrefixes,
  }).storageFilePath
}
