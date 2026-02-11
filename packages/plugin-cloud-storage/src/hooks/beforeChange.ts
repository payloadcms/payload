import type { CollectionConfig, FieldHook, ImageSize } from 'payload'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  disablePayloadAccessControl?: boolean
  generateFileURL?: GenerateFileURL
  size?: ImageSize
}

export const getBeforeChangeHook =
  ({ adapter, collection, disablePayloadAccessControl, generateFileURL, size }: Args): FieldHook =>
  async ({ data, originalDoc, value }) => {
    if (!disablePayloadAccessControl) {
      return value
    } else {
      const newFilename = size ? data?.sizes?.[size.name]?.filename : data?.filename
      const originalFilename = size
        ? originalDoc?.sizes?.[size.name]?.filename
        : originalDoc?.filename
      const filename = newFilename || originalFilename
      const prefix = data?.prefix
      let url = value

      // Store the full URL in the database so files can be accessed directly
      // from the storage provider without going through Payload's API
      if (generateFileURL) {
        url = await generateFileURL({
          collection,
          filename,
          prefix,
          size,
        })
      } else if (adapter.generateURL) {
        url = await adapter.generateURL({
          collection,
          data: data || originalDoc,
          filename,
          prefix,
        })
      }

      return url
    }
  }
