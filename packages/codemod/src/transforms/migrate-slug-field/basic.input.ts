import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    slugField(),
    slugField({
      name: 'requiredSlug',
      useAsSlug: 'requiredTitle',
      required: true,
      checkboxName: 'generateRequiredSlug',
      disableUnique: true,
      position: 'main',
    }),
  ],
}
