import type { CollectionConfig } from 'payload'

import { baseRelationshipFields } from '../../baseFields.js'
import { relationTrueFilterOptionSlug } from '../../slugs.js'

export const RelationshipFilterTrue: CollectionConfig = {
  admin: {
    useAsTitle: 'name',
  },
  fields: baseRelationshipFields,
  slug: relationTrueFilterOptionSlug,
}
