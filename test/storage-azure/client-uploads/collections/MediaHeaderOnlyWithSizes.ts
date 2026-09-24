import type { CollectionConfig } from 'payload'

export const mediaHeaderOnlyWithSizesSlug = 'media-header-only-with-sizes'

export const MediaHeaderOnlyWithSizes: CollectionConfig = {
  slug: mediaHeaderOnlyWithSizesSlug,
  fields: [],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        // Skip the internal metadata-only update that plugin-cloud-storage issues after
        // uploading generated image sizes - it intentionally clears req.file first.
        if (req.context?.skipCloudStorage) {
          return data
        }
        if (!req.file || req.file.data.length !== 0 || !req.file.tempFilePath) {
          throw new Error('Full client upload was buffered instead of staged')
        }
        return data
      },
    ],
  },
  upload: {
    disableLocalStorage: true,
    imageSizes: [{ name: 'thumbnail', height: 300, width: 400 }],
  },
  versions: false,
}
