import type { CollectionConfig } from 'payload'

import { unauthorizedSlug } from '../../slugs.js'

const Unauthorized: CollectionConfig = {
  slug: unauthorizedSlug,
  access: {
    create: () => false,
    delete: () => false,
    read: () => true,
    update: () => false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export default Unauthorized
