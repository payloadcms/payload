import type { CollectionConfig } from 'payload'

export const mediaHeaderOnlySlug = 'media-header-only'

/**
 * No `resizeOptions`/`formatOptions`/`trimOptions`/`mimeTypes` configured, and
 * `disableLocalStorage: true` - the combination that makes `getFileContentRequirement` choose
 * the `'header'` content-requirement path for a plain image upload. That path only fetches a
 * byte-range probe from the real storage adapter's handler, rather than the whole file.
 */
export const MediaHeaderOnly: CollectionConfig = {
  slug: mediaHeaderOnlySlug,
  fields: [],
  upload: {
    disableLocalStorage: true,
  },
  versions: false,
}
