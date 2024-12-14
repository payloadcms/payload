import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  fields: [
    {
      name: 'title',
      type: 'relationship',
      relationTo: 'texts',
    },
  ],
}
