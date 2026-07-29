import type { CollectionConfig } from 'payload'

import { relationFilterOptionsThrowsSlug, relationOneSlug } from '../../slugs.js'

export const RelationshipFilterOptionsThrows: CollectionConfig = {
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'relationshipWithThrowingFilterOptions',
      type: 'relationship',
      filterOptions: () => {
        throw new Error('Intentional error thrown by filterOptions for testing purposes')
      },
      relationTo: relationOneSlug,
    },
  ],
  slug: relationFilterOptionsThrowsSlug,
  versions: false,
}
