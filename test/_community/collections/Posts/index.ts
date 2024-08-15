import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      type: 'ui',
      name: 'ui',
      admin: {
        components: {
          Field: '/collections/Posts/TableField/index.js#TableField',
        },
      },
    },
  ],
  versions: {
    drafts: true,
  },
}
