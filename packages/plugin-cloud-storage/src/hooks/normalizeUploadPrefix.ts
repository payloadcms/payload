import type { CollectionBeforeChangeHook, FieldHook } from 'payload'

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

/** Persist new upload destinations without reinterpreting metadata-only updates. */
export const getNormalizeUploadPrefixHook =
  ({ collectionPrefix, useCompositePrefixes }: Args): CollectionBeforeChangeHook =>
  ({ data, originalDoc, req }) => {
    if (req.context?.skipCloudStorage) {
      return data
    }

    if (!req.file && !isPrefixSupplied({ storedPrefix: originalDoc?.prefix, value: data.prefix })) {
      return data
    }

    data.prefix = buildUploadPrefix({
      collectionPrefix,
      docPrefix: typeof data.prefix === 'string' ? data.prefix : '',
      useCompositePrefixes,
    }).sanitizedDocPrefix

    return data
  }

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

    return buildUploadPrefix({
      collectionPrefix,
      docPrefix: typeof value === 'string' ? value : '',
      useCompositePrefixes,
    }).sanitizedDocPrefix
  }
