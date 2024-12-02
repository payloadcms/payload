import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    // useAsTitle: 'title',
  },
  fields: [
    {
      name: 'hiddenField',
      type: 'text',
      admin: {
        disabled: true,
      },
    },
    {
      type: 'collapsible',
      admin: {
        components: {
          Label: './CustomComponent.tsx#CustomComponent',
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
