import type { CollectionConfig } from 'payload'

import { drawersSlug, relationshipFieldsSlug, textFieldsSlug } from '../../slugs.js'
import { drawerBlocks } from './blocks.js'

const Drawers: CollectionConfig = {
  slug: drawersSlug,
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
      relationTo: drawersSlug,
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
      name: 'blocks',
      type: 'blocks',
      admin: {
        description: 'Add a block to open the blocks drawer.',
      },
      blocks: drawerBlocks,
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

export default Drawers
