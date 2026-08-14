import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  trash: true,
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
      name: 'triggerFormStateUpdate',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/TriggerFormStateUpdate/index.tsx#TriggerFormStateUpdate',
        },
      },
    },
    {
      name: 'richText',
      type: 'richText',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab',
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
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
