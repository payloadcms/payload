import type { CollectionConfig } from 'payload'

import { staticFileMediaSlug } from '../shared.js'

/**
 * Document reads require a logged-in user. Static file reads stay public, which is the
 * access shape that `getFilePrefix` must honor when a file URL has no `?prefix=`.
 */
export const StaticFileMedia: CollectionConfig = {
  slug: staticFileMediaSlug,
  access: {
    read: ({ isReadingStaticFile, req }) => {
      if (isReadingStaticFile) {
        return true
      }

      return Boolean(req.user)
    },
  },
  fields: [],
  upload: {
    disableLocalStorage: true,
    mimeTypes: ['image/png'],
  },
  versions: false,
}
