import type { CollectionConfig } from 'payload'

import { secondaryAdminUserCollectionSlug } from '../slugs.js'

export const SecondaryAdminUsers: CollectionConfig = {
  slug: secondaryAdminUserCollectionSlug,
  access: {
    admin: () => true,
    read: () => true,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [],
}
