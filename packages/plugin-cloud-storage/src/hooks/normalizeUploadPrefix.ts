import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook, FieldHook } from 'payload'

import path from 'path'
import { APIError } from 'payload'

import { buildUploadPrefix } from '../utilities/buildStoragePathData.js'

type Args = {
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

/**
 * A prefix the caller did not supply, or supplied unchanged, is left as stored so
 * pre-upgrade files keep resolving to their original object keys. Anything the caller
 * chooses is contained, because `prefix` is writable through the REST, GraphQL and
 * Local APIs and the read path trusts whatever is persisted.
 */
const isPrefixSupplied = ({
  storedPrefix,
  value,
}: {
  storedPrefix: unknown
  value: unknown
}): boolean =>
  typeof value === 'string' && value !== (typeof storedPrefix === 'string' ? storedPrefix : '')

/**
 * Stands in for the stored prefix during the filename check, so the check covers the collection.
 * The prefix field puts the stored value back first thing in `beforeValidate`, so only
 * `beforeValidate` hooks on fields before it see `null`.
 */
const keepStoredPrefix = null

/** Collection-folder uploads store the collection prefix, so `_objectKey` folders resolve beneath it. */
const getStoredUploadPrefix = ({
  collectionPrefix,
  prefix,
  useCompositePrefixes,
}: { prefix: unknown } & Args): string => {
  const { sanitizedDocPrefix, uploadPrefix } = buildUploadPrefix({
    collectionPrefix,
    docPrefix: typeof prefix === 'string' ? prefix : '',
    useCompositePrefixes,
  })

  return useCompositePrefixes ? sanitizedDocPrefix : uploadPrefix
}

/**
 * Resolves the prefix before Payload picks a unique filename, so the check uses the stored prefix.
 * Collection-folder prefixes, and the stored prefix of an update, are cleared so the check covers
 * the whole collection.
 */
export const getResolveUploadPrefixHook =
  ({ collectionPrefix, useCompositePrefixes }: Args): CollectionBeforeOperationHook =>
  async ({ args, collection, operation, req }) => {
    const isFileWrite = operation === 'create' || (operation === 'update' && Boolean(req.file))

    if (!isFileWrite || req.context?.skipCloudStorage) {
      return args
    }

    const data: unknown = args.data

    if (!data || typeof data !== 'object') {
      return args
    }

    const isDuplicate = operation === 'create' && args.duplicateFromID != null

    if (isDuplicate && 'prefix' in data) {
      // A duplicate stores its source's file data, so a caller prefix would only narrow the check.
      const { prefix: _prefix, ...dataWithoutPrefix } = data

      return { ...args, data: dataWithoutPrefix }
    }

    if (!('prefix' in data) || data.prefix === undefined) {
      // Payload fills in the stored prefix after this hook and checks filenames under that value only.
      return operation === 'update' && !args.overrideAccess
        ? { ...args, data: { ...data, prefix: keepStoredPrefix } }
        : args
    }

    const { sanitizedCollectionPrefix, sanitizedDocPrefix, uploadPrefix } = buildUploadPrefix({
      collectionPrefix,
      docPrefix: typeof data.prefix === 'string' ? data.prefix : '',
      useCompositePrefixes,
    })
    const isCollectionFolder = useCompositePrefixes
      ? !sanitizedDocPrefix
      : uploadPrefix === sanitizedCollectionPrefix

    if (!isCollectionFolder) {
      const objectKey = path.posix.basename(sanitizedDocPrefix)
      const docWithObjectKeyFolder = await req.payload.db.findOne({
        collection: collection.slug,
        req,
        where: { _objectKey: { equals: objectKey } },
      })
      // Drafts and older versions can keep an object key the document no longer has.
      const versionWithObjectKeyFolder = collection.versions
        ? (
            await req.payload.db.findVersions({
              collection: collection.slug,
              limit: 1,
              pagination: false,
              req,
              where: { 'version._objectKey': { equals: objectKey } },
            })
          ).docs[0]
        : undefined

      if (docWithObjectKeyFolder || versionWithObjectKeyFolder) {
        throw new APIError('The provided prefix is not allowed.', 400)
      }

      return { ...args, data: { ...data, prefix: sanitizedDocPrefix } }
    }

    if (operation === 'update') {
      return { ...args, data: { ...data, prefix: '' } }
    }

    const { prefix: _prefix, ...dataWithoutPrefix } = data

    return { ...args, data: dataWithoutPrefix }
  }

/** Persist new upload destinations without reinterpreting metadata-only updates. */
export const getNormalizeUploadPrefixHook =
  ({ collectionPrefix, useCompositePrefixes }: Args): CollectionBeforeChangeHook =>
  ({ data, originalDoc, req }) => {
    if (req.context?.skipCloudStorage) {
      return data
    }

    // Only reached when the plugin does not own the prefix field and its `beforeValidate` hook.
    if (req.file && data.prefix === keepStoredPrefix) {
      data.prefix = originalDoc?.prefix
    }

    if (!req.file && !isPrefixSupplied({ storedPrefix: originalDoc?.prefix, value: data.prefix })) {
      return data
    }

    data.prefix = getStoredUploadPrefix({
      collectionPrefix,
      prefix: data.prefix,
      useCompositePrefixes,
    })

    return data
  }

/** Run first on the prefix field so other prefix hooks see the stored value after a file update. */
export const getRestoreStoredPrefixFieldHook =
  (): FieldHook =>
  ({ previousValue, req, value }) =>
    req.file && value === keepStoredPrefix ? previousValue : value

/** Run last on the prefix field so user hooks cannot leave stale storage coordinates. */
export const getNormalizeUploadPrefixFieldHook =
  ({ collectionPrefix, useCompositePrefixes }: Args): FieldHook =>
  ({ previousValue, req, value }) => {
    if (req.context?.skipCloudStorage) {
      return value
    }

    if (!req.file && !isPrefixSupplied({ storedPrefix: previousValue, value })) {
      return value
    }

    return getStoredUploadPrefix({ collectionPrefix, prefix: value, useCompositePrefixes })
  }
