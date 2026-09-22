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
const getObjectFolder = (data: unknown): string => {
  const record = (data ?? {}) as Record<string, unknown>
  const safePrefix = sanitizePrefix(typeof record.prefix === 'string' ? record.prefix : '')
  const safeObjectKey = sanitizePrefix(
    typeof record._objectKey === 'string' ? record._objectKey : '',
  )

  if (safePrefix && safeObjectKey) {
    return `${safePrefix}/${safeObjectKey}`
  }

  return safePrefix || safeObjectKey
}

export const getAfterReadHook =
  ({ adapter, collection, disablePayloadAccessControl, generateFileURL, size }: Args): FieldHook =>
  async ({ data, value }) => {
    const filename = size ? data?.sizes?.[size.name]?.filename : data?.filename
    const prefix = data?.prefix
    // Direct-serve URLs encode the full location; the proxy resolves `_objectKey` server-side.
    const objectFolder = getObjectFolder(data)
    let url = value

    if (filename) {
      if (generateFileURL) {
        url = await generateFileURL({
          collection,
          filename,
          prefix: objectFolder,
          size,
        })
      } else if (disablePayloadAccessControl && adapter.generateURL) {
        url = await adapter.generateURL({
          collection,
          data,
          filename,
          prefix: objectFolder,
        })
      } else if (url && prefix) {
        const separator = url.includes('?') ? '&' : '?'
        url = `${url}${separator}prefix=${encodeURIComponent(prefix)}`
      }
    }

    return url
  }
