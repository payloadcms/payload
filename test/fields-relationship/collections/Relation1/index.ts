import type { CollectionConfig } from 'payload'

import { baseRelationshipFields } from '../../baseFields.js'
import { relationOneSlug } from '../../slugs.js'

export const Relation1: CollectionConfig = {
  slug: relationOneSlug,
  fields: baseRelationshipFields,
  labels: {
    plural: {
      en: 'Relation Ones',
    },
    singular: {
      en: 'Relation One',
    },
  },
  versions: false,
}
