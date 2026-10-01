import type { CollectionConfig } from 'payload'

import { controls, mediaSlug, outerRequests } from '../shared.js'

export const Media: CollectionConfig = {
  slug: mediaSlug,
  access: { create: () => true, read: () => true, update: () => true, delete: () => true },
  fields: [{ name: 'storageVersion', type: 'number', defaultValue: 0 }],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'update') {
          if (req.context.skipCloudStorage) {
            await controls.onMetadataUpdate?.()
          } else {
            outerRequests.push({ context: req.context, file: req.file, query: req.query })
            controls.onOuterUpdate?.()
          }
        }
        return data
      },
    ],
  },
  upload: { focalPoint: false, skipSafeFetch: true },
}
