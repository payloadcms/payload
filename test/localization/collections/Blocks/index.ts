import type { CollectionConfig } from 'payload'

export const blocksCollectionSlug = 'blocks-fields'

export const BlocksCollection: CollectionConfig = {
  slug: blocksCollectionSlug,
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab',
          fields: [
            {
              name: 'tabContent',
              label: 'Content',
              type: 'blocks',
              localized: true,
              blocks: [
                {
                  slug: 'blockInsideTab',
                  fields: [{ type: 'text', name: 'text' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'content',
      label: 'Content',
      type: 'blocks',
      localized: true,
      blocks: [
        {
          slug: 'blockInsideBlock',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'content',
              type: 'blocks',
              blocks: [
                {
                  slug: 'textBlock',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              name: 'array',
              type: 'array',
              fields: [
                {
                  name: 'link',
                  type: 'group',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
