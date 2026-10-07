import type { CollectionConfig, FieldHook, ImageSize } from 'payload'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

import { sanitizePrefix } from '../utilities/sanitizePrefix.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  disablePayloadAccessControl?: boolean
  generateFileURL?: GenerateFileURL
  isOriginal?: boolean
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
  ({
    adapter,
    collection,
    disablePayloadAccessControl,
    generateFileURL,
    isOriginal,
    size,
  }: Args): FieldHook =>
  async ({ data, value }) => {
    const representation = isOriginal ? data?.original : size ? data?.variants?.[size.name] : data
    const filename = representation?.filename
    const hasLegacyVariant = Boolean(size && !data?.original?.filename)
    const prefix = representation?.prefix ?? (hasLegacyVariant ? data?.prefix : undefined)
    // Direct-serve URLs encode the full location; the proxy resolves `_objectKey` server-side.
    const objectFolder = getObjectFolder({
      _objectKey: representation?._objectKey ?? (hasLegacyVariant ? data?._objectKey : undefined),
      prefix,
    })
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
        url = appendProxyPrefix({ prefix, url })
      }
    }

    return url
  }

export const appendProxyPrefix = ({ prefix, url }: { prefix: string; url: string }): string => {
  if (new URL(url, 'http://payload.local').searchParams.has('prefix')) {
    return url
  }
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}prefix=${encodeURIComponent(prefix)}`
}
