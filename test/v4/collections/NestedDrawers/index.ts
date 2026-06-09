import type { CollectionConfig } from 'payload'

import { nestedDrawersSlug, relationshipFieldsSlug, textFieldsSlug } from '../../slugs.js'

const NestedDrawers: CollectionConfig = {
  slug: nestedDrawersSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'child',
      type: 'relationship',
      relationTo: nestedDrawersSlug,
      admin: {
        description: 'Open or create a related doc to nest another drawer.',
      },
    },
    {
      name: 'relatedText',
      type: 'relationship',
      relationTo: textFieldsSlug,
      admin: {
        appearance: 'drawer',
        description: 'Opens a text-fields doc — different content in the drawer.',
      },
    },
    {
      name: 'relatedRelationship',
      type: 'relationship',
      relationTo: relationshipFieldsSlug,
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}

export default NestedDrawers
