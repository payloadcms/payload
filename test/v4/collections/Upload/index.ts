import type { CollectionConfig } from 'payload'

import { uploadsSlug } from '../../slugs.js'

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  admin: {},
  upload: true,
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
  ],
  versions: false,
}

export default Uploads
