import type { CollectionConfig } from 'payload'

import { uploads2Slug, uploadsMulti, uploadsSlug } from '../../slugs.js'

const Uploads: CollectionConfig = {
  slug: uploadsMulti,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'media',
      type: 'upload',
      hasMany: true,
      relationTo: [uploadsSlug, uploads2Slug],
    },
  ],
}

export default Uploads
