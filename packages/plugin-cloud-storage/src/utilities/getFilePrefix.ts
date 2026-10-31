import type {
  Access,
  CollectionConfig,
  FileData,
  PayloadRequest,
  SanitizedUploadConfig,
  TypeWithID,
  Where,
} from 'payload'

import { combineQueries, executeAccess, Forbidden } from 'payload'

import { buildPrefixWithObjectKey } from './buildPrefixWithObjectKey.js'
import { buildUploadStoragePathData } from './buildStoragePathData.js'
import { sanitizePrefix } from './sanitizePrefix.js'

/**
 * Resolves the folder a stored object lives under (semantic `prefix` plus `_objectKey`).
 *
 * An already-authorized `doc` wins outright. Otherwise an `uploadReference` is used (its
 * `prefix` re-contained with {@link buildUploadStoragePathData}, since it hasn't been verified against
 * a signed receipt by every adapter). Otherwise read access is evaluated with
 * `isReadingStaticFile: true`, the same contract as `checkFileAccess`. A returned Where
 * query constrains the lookup. Any query-param prefix only narrows that lookup, and
 * `_objectKey` is read from the resolved document via `showHiddenFields`.
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
  doc?: Partial<FileData> & TypeWithID
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
    return getRepresentationPrefix({ doc, filename })
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
  const variants = (collection?.upload as SanitizedUploadConfig)?.variants || []

  const filenameClause = {
    or: [
      {
        filename: { equals: filename },
      },
      { 'original.filename': { equals: filename } },
      ...variants.map((imageSize) => ({
        [`variants.${imageSize.name}.filename`]: { equals: filename },
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

  // `find({ overrideAccess: false })` runs collection read access without
  // `isReadingStaticFile`, so a rule that allows anonymous file bytes and denies
  // document reads throws Forbidden. Evaluate that access the same way
  // `checkFileAccess` does, then look the prefix up under the result.
  const accessResult = await executeAccess(
    { slug: collection.slug, data: { filename }, isReadingStaticFile: true, req },
    getStaticFileReadAccess({ collection, req }),
  )

  if (!accessResult) {
    throw new Forbidden(req.t)
  }

  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: true,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    select: {
      _objectKey: true,
      filename: true,
      original: true,
      prefix: true,
      variants: true,
    },
    showHiddenFields: true,
    where: constrainWhere({ accessResult, where }),
  })

  const found = files?.docs?.[0] as
    | ({ _objectKey?: string; prefix?: string } & Partial<FileData>)
    | undefined

  // A Where that matches nothing is a denial, same as `checkFileAccess`. A boolean
  // grant with no document means the file is absent, so the caller can 404.
  if (!found && typeof accessResult === 'object') {
    throw new Forbidden(req.t)
  }

  return found ? getRepresentationPrefix({ doc: found, filename }) : ''
}

/**
 * Sanitized collection access includes `baseAccess`. Fall back to the incoming
 * config when this runs without an initialized Payload instance.
 */
const getStaticFileReadAccess = ({
  collection,
  req,
}: {
  collection: CollectionConfig
  req: PayloadRequest
}): Access | undefined =>
  req.payload.collections?.[collection.slug]?.config.access.read ?? collection.access?.read

const constrainWhere = ({
  accessResult,
  where,
}: {
  accessResult: boolean | Where
  where: Where
}): Where => (typeof accessResult === 'object' ? combineQueries(where, accessResult) : where)

const getRepresentationPrefix = ({
  doc,
  filename,
}: {
  doc: Partial<FileData>
  filename: string
}): string => {
  const representation =
    doc.original?.filename === filename
      ? doc.original
      : (Object.values(doc.variants ?? {}).find((variant) => variant?.filename === filename) ?? doc)
  return buildPrefixWithObjectKey({
    objectKey: representation._objectKey ?? (!doc.original?.filename ? doc._objectKey : undefined),
    prefix: representation.prefix ?? (!doc.original?.filename ? doc.prefix : undefined),
  })
}
