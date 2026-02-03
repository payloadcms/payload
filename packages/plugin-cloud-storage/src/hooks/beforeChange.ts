import type { CollectionConfig, FieldHook, ImageSize } from 'payload'

import type { GeneratedAdapter } from '../types.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  disablePayloadAccessControl?: boolean
  size?: ImageSize
}

export const getBeforeChangeHook =
  ({ adapter, collection, disablePayloadAccessControl, size }: Args): FieldHook =>
  async ({ data, originalDoc, value }) => {
    // Only handle the disablePayloadAccessControl: true case here
    // When false, let the core beforeChange hook from getBaseFields handle it
    if (!disablePayloadAccessControl) {
      return value
    }

    const filename = size ? data?.sizes?.[size.name]?.filename : data?.filename

    if (!filename) {
      return value
    }

    const prefix = data?.prefix

    // Store the full URL in the database so files can be accessed directly
    // from the storage provider without going through Payload's API
    if (adapter.generateURL) {
      return await adapter.generateURL({
        collection,
        data: data || originalDoc,
        filename,
        prefix,
      })
    }

    return value
  }
