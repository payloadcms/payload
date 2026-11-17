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
      name: 'restrictedValue',
      type: 'text',
      access: {
        create: () => false,
      },
    },
    {
      name: 'showConditionalField',
      type: 'checkbox',
    },
    {
      name: 'conditionalField',
      type: 'text',
      admin: {
        condition: (data) => data?.showConditionalField === true,
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
