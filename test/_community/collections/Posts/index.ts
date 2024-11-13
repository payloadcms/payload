import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: ({ value }) => value as string,
      admin: {
        components: {
          Label: '/collections/Posts/FieldLabel.tsx#FieldLabel',
        },
      },
    },
  ],
  versions: {
    drafts: true,
  },
}
