import type { CollectionConfig } from 'payload'

import { uploads2Slug, uploadsPoly, uploadsSlug } from '../../slugs.js'

const Uploads: CollectionConfig = {
  slug: uploadsPoly,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: [uploadsSlug, uploads2Slug],
    },
  ],
}

export default Uploads
