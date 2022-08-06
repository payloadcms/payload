import type { ImageSize } from 'payload/dist/uploads/types'
import type { CollectionConfig, FieldHook } from 'payload/types'
import type { GeneratedAdapter } from '../types'

interface Args {
  collection: CollectionConfig
  adapter: GeneratedAdapter
  size?: ImageSize
}

export const getAfterReadHook =
  ({ collection, adapter, size }: Args): FieldHook =>
  async ({ data, value }) => {
    const filename = size ? data?.sizes?.[size.name]?.filename : data?.filename

    const url = await adapter.generateURL({
      collection,
      filename,
    })

    return url || value
  }
