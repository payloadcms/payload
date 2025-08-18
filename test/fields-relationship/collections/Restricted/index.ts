import type { CollectionConfig } from 'payload'

import { baseRelationshipFields } from '../../baseFields.js'
import { relationRestrictedSlug } from '../../slugs.js'

export const Restricted: CollectionConfig = {
  access: {
    create: () => false,
    read: () => false,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: baseRelationshipFields,
  slug: relationRestrictedSlug,
}
