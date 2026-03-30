import type { CollectionConfig } from 'payload'

import { bmChildASlug, bmChildBSlug, bmParentSlug } from './slugs.js'

export { bmParentSlug }

export const BmParent: CollectionConfig = {
  slug: bmParentSlug,
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'children',
      type: 'join',
      collection: [bmChildASlug, bmChildBSlug],
      on: 'parent',
    },
  ],
}
