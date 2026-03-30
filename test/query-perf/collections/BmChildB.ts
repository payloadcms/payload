import type { CollectionConfig } from 'payload'

import { bmChildBSlug, bmParentSlug } from './slugs.js'

export { bmChildBSlug }

export const BmChildB: CollectionConfig = {
  slug: bmChildBSlug,
  fields: [
    { name: 'label', type: 'text' },
    { name: 'parent', type: 'relationship', relationTo: bmParentSlug },
  ],
}
