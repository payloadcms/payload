import type { CollectionConfig } from 'payload'

import { textFieldsSlug } from '../../slugs.js'

const TextFields: CollectionConfig = {
  slug: textFieldsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The public-facing title of this post',
      },
    },
    {
      name: 'favoriteFruit',
      type: 'text',
      hasMany: true,
      label: 'Favorite Fruit',
      admin: {
        description: 'List your favorite fruits',
      },
    },
  ],
}

export default TextFields
