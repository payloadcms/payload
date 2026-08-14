import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const Posts: CollectionConfig = {
  slug: postsSlug,
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
      name: 'localizedField',
      type: 'text',
      localized: true,
    },
    {
      name: 'showConditionalRichText',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'richTextInTab',
              type: 'richText',
            },
            {
              name: 'conditionalRichTextInTab',
              type: 'richText',
              admin: {
                condition: ({ showConditionalRichText }) => showConditionalRichText === 'show',
              },
            },
          ],
          label: 'Tab',
        },
      ],
    },
  ],
  trash: true,
  versions: {
    drafts: true,
  },
}
