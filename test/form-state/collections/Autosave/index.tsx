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
      name: 'computedTitle',
      type: 'text',
      hooks: {
        beforeChange: [({ data }) => data?.title],
      },
    },
    {
      name: 'programmaticValue',
      type: 'text',
    },
    {
      name: 'nonDirtyFieldUpdater',
      type: 'ui',
      admin: {
        components: {
          Field: './collections/Autosave/NonDirtyFieldUpdater.js#NonDirtyFieldUpdater',
        },
      },
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
