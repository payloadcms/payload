import type { CollectionConfig } from 'payload'

export const localizedPlainPostsSlug = 'localized-plain-posts'

export const LocalizedPlainPosts: CollectionConfig = {
  slug: localizedPlainPostsSlug,
  access: {
    update: ({ data, req }) => req.locale !== 'es' || data?.title !== 'Denied copy source',
  },
  fields: [{ name: 'title', type: 'text', localized: true }],
}
