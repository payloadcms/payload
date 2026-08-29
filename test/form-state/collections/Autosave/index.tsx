import type { CollectionConfig } from 'payload'

export const autosavePostsSlug = 'autosave-posts'

export const AutosavePostsCollection: CollectionConfig = {
  slug: autosavePostsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'subtitle',
      type: 'text',
    },
    {
      name: 'computedTitle',
      type: 'text',
      hooks: {
        beforeChange: [({ data }) => data?.title],
      },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      admin: {
        appearance: 'drawer',
      },
      hasMany: true,
      relationTo: autosavePostsSlug,
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}
