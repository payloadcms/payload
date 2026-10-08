import type { CollectionConfig } from 'payload'

export const mediaHeaderOnlySlug = 'media-header-only'

const HEADER_PROBE_BYTE_LENGTH = 1024 * 1024

export const MediaHeaderOnly: CollectionConfig = {
  slug: mediaHeaderOnlySlug,
  fields: [],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (!req.file || req.file.tempFilePath || req.file.data.length > HEADER_PROBE_BYTE_LENGTH) {
          throw new Error('Header-only client upload exceeded its byte boundary')
        }
        return data
      },
    ],
  },
  upload: { disableLocalStorage: true },
  versions: false,
}
