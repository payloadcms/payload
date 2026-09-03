import type { CollectionConfig } from 'payload'

export const mediaHeaderOnlySlug = 'media-header-only'

const HEADER_PROBE_BYTE_LENGTH = 1024 * 1024

/**
 * No `resizeOptions`/`formatOptions`/`trimOptions`/`mimeTypes` configured, and
 * `disableLocalStorage: true` - the combination that makes `getFileContentRequirement` choose
 * the `'header'` content-requirement path for a plain image upload. That path only fetches a
 * byte-range probe from the real storage adapter's handler, rather than the whole file.
 */
export const MediaHeaderOnly: CollectionConfig = {
  slug: mediaHeaderOnlySlug,
  fields: [],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const file = req.file

        if (file?.name === 'no-content-tripwire.mp3') {
          if (file.data.length !== 0 || file.tempFilePath) {
            throw new Error('No-content upload was materialized')
          }
        }

        if (file?.name === 'header-only-tripwire.jpg') {
          if (file.data.length > HEADER_PROBE_BYTE_LENGTH || file.tempFilePath) {
            throw new Error('Header-only upload exceeded its memory boundary')
          }
        }

        return data
      },
    ],
  },
  upload: {
    disableLocalStorage: true,
  },
  versions: false,
}
