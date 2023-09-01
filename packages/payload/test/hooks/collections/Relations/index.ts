import type { CollectionConfig } from '../../../../src/collections/config/types'

export const relationsSlug = 'relations'

const Relations: CollectionConfig = {
  slug: relationsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}

export default Relations
