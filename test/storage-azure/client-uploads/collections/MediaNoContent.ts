import type { CollectionConfig } from 'payload'

export const mediaNoContentSlug = 'media-no-content'

export const MediaNoContent: CollectionConfig = {
  slug: mediaNoContentSlug,
  fields: [],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (!req.file || req.file.data.length !== 0 || req.file.tempFilePath) {
          throw new Error('No-content client upload was materialized')
        }
        return data
      },
    ],
  },
  upload: { disableLocalStorage: true },
  versions: false,
}
