import type { CollectionConfig } from 'payload'

import { uploads2Slug, uploadsMultiPoly, uploadsSlug } from '../../slugs.js'

const Uploads: CollectionConfig = {
  slug: uploadsMultiPoly,
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
