import type { CollectionAfterReadHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

import { buildPrefixWithObjectKey } from '../utilities/buildPrefixWithObjectKey.js'

export const getPublicOriginalURLHook =
  ({
    adapter,
    collection,
    generateFileURL,
  }: {
    adapter: GeneratedAdapter
    collection: CollectionConfig
    generateFileURL?: GenerateFileURL
  }): CollectionAfterReadHook =>
  async ({ doc }) => {
    const upload = doc as { _objectKey?: string; prefix?: string } & FileData & TypeWithID
    const filename = upload.original?.filename

    if (!filename) {
      return doc
    }

    const prefix = buildPrefixWithObjectKey({
      objectKey: upload.original?._objectKey ?? upload._objectKey,
      prefix: upload.original?.prefix ?? upload.prefix,
    })
    const url = generateFileURL
      ? await generateFileURL({ collection, filename, prefix })
      : await adapter.generateURL?.({ collection, data: upload, filename, prefix })

    return url ? { ...doc, original: { ...upload.original, url } } : doc
  }
