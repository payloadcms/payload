import { createTagsCollection } from 'payload'

import { tagsSlug } from '../../shared.js'

export const Tags = createTagsCollection({
  slug: tagsSlug,
  useAsTitle: 'name',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
  ],
})
