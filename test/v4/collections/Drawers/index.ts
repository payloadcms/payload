import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'

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
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Use the link and inline block toolbar items to open their drawers.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          LinkFeature({
            fields: ({ defaultFields }) => [
              ...defaultFields,
              {
                name: 'rel',
                type: 'select',
                hasMany: true,
                options: ['noopener', 'noreferrer', 'nofollow'],
              },
            ],
          }),
          BlocksFeature({
            inlineBlocks: [
              {
                slug: 'inline-cta',
                fields: [
                  {
                    name: 'label',
                    type: 'text',
                    required: true,
                  },
                  {
                    name: 'url',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
        ],
      }),
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
