import type { CollectionConfig } from 'payload'

import { dynamicMediaDir, dynamicMediaSlug } from '../shared.js'

export const DynamicMedia: CollectionConfig = {
  slug: dynamicMediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    // Anyone may read the saved file; only a signed-in user may change it with query parameters.
    read: ({ req }) => (req.fileTransform ? Boolean(req.user) : true),
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  upload: { staticDir: dynamicMediaDir },
}
