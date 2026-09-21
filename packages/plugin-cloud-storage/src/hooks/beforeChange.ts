import type { CollectionConfig, FieldHook, ImageSize } from 'payload'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

import { sanitizePrefix } from '../utilities/sanitizePrefix.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  disablePayloadAccessControl?: boolean
  generateFileURL?: GenerateFileURL
  size?: ImageSize
}

// The object's folder: semantic prefix + `_objectKey` segment.
const getObjectFolder = (data: unknown, originalDoc: unknown): string => {
  const source = (data ?? originalDoc ?? {}) as Record<string, unknown>
  const safePrefix = sanitizePrefix(typeof source.prefix === 'string' ? source.prefix : '')
  const safeObjectKey = sanitizePrefix(
    typeof source._objectKey === 'string' ? source._objectKey : '',
  )

  if (safePrefix && safeObjectKey) {
    return `${safePrefix}/${safeObjectKey}`
  }

  return safePrefix || safeObjectKey
}

export const getBeforeChangeHook =
  ({ adapter, collection, disablePayloadAccessControl, generateFileURL, size }: Args): FieldHook =>
  async ({ data, originalDoc, value }) => {
    const newFilename = size ? data?.sizes?.[size.name]?.filename : data?.filename
    const originalFilename = size
      ? originalDoc?.sizes?.[size.name]?.filename
      : originalDoc?.filename
    const filename = newFilename || originalFilename
    const prefix = getObjectFolder(data, originalDoc)
    let url = value

    if (generateFileURL && filename) {
      url = await generateFileURL({
        collection,
        filename,
        prefix,
        size,
      })
    } else if (disablePayloadAccessControl && filename && adapter.generateURL) {
      url = await adapter.generateURL({
        collection,
        data: data || originalDoc,
        filename,
        prefix,
      })
    }

    return url
  }
