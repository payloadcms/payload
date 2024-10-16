import type { CollectionConfig } from 'payload'

import { uploadsRestricted, uploadsSlug } from '../../slugs.js'

const Uploads: CollectionConfig = {
  slug: uploadsRestricted,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'uploadWithoutRestriction',
      type: 'upload',
      relationTo: uploadsSlug,
    },
    {
      name: 'uploadWithAllowCreateFalse',
      type: 'upload',
      relationTo: uploadsSlug,
      admin: {
        allowCreate: false,
      },
    },
    {
      name: 'uploadMultipleWithAllowCreateFalse',
      type: 'upload',
      relationTo: uploadsSlug,
      hasMany: true,
      admin: { allowCreate: false },
    },
  ],
}

export default Uploads
