import type { CollectionConfig } from 'payload'

import { uploadsSlug } from '../../slugs.js'

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  upload: true,
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
  ],
}

export default Uploads
