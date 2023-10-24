import type { CollectionConfig, FieldHook, ImageSize } from 'payload/types'

import type { GenerateFileURL, GeneratedAdapter } from '../types'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  disablePayloadAccessControl?: boolean
  generateFileURL?: GenerateFileURL
  size?: ImageSize
}

export const getAfterReadHook =
  ({ adapter, collection, disablePayloadAccessControl, generateFileURL, size }: Args): FieldHook =>
  async ({ data, value }) => {
    const filename = size ? data?.sizes?.[size.name]?.filename : data?.filename
    const prefix = data?.prefix
    let url = value

    if (disablePayloadAccessControl && filename) {
      url = await adapter.generateURL({
        collection,
        filename,
        prefix,
      })
    }

    if (generateFileURL) {
      url = await generateFileURL({
        collection,
        filename,
        prefix,
        size,
      })
    }

    return url
  }
