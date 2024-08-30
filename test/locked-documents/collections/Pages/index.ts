import type { CollectionConfig } from 'payload'

export const pagesSlug = 'pages'

export const PagesCollection: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'text',
  },
  lockWhenEditing: false,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
    },
    {
      name: 'myBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'test',
          fields: [
            {
              name: 'test',
              type: 'text',
            },
          ],
        },
        {
          slug: 'someBlock2',
          fields: [
            {
              name: 'test2',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
