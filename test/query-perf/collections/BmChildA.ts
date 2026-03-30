import type { CollectionConfig } from 'payload'

import { bmChildASlug, bmParentSlug } from './slugs.js'

export { bmChildASlug }

export const BmChildA: CollectionConfig = {
  slug: bmChildASlug,
  fields: [
    { name: 'label', type: 'text' },
    { name: 'parent', type: 'relationship', relationTo: bmParentSlug },
  ],
}
