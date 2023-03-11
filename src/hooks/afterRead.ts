import type { ImageSize } from 'payload/dist/uploads/types'
import type { CollectionConfig, FieldHook } from 'payload/types'
import type { GeneratedAdapter, GenerateFileURL } from '../types'

interface Args {
  collection: CollectionConfig
  adapter: GeneratedAdapter
  disablePayloadAccessControl?: boolean
  size?: ImageSize
  generateFileURL?: GenerateFileURL
}

export const getAfterReadHook =
  ({ collection, adapter, size, disablePayloadAccessControl, generateFileURL }: Args): FieldHook =>
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
