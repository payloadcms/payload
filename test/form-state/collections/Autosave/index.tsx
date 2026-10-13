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
      validate: (value: null | string | undefined) =>
        value?.startsWith('ok') ? true : 'Must start with "ok".',
    },
    {
      name: 'type',
      type: 'radio',
      defaultValue: 'internal',
      options: ['internal', 'custom'],
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'custom',
      },
    },
    {
      name: 'computedTitle',
      type: 'text',
      admin: {
        description: 'Edits are replaced by a server-computed value after autosave.',
        readOnly: true,
      },
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
    {
      name: 'documentInfoData',
      type: 'ui',
      admin: {
        components: {
          Field: './collections/Autosave/DocumentInfoData.js#DocumentInfoData',
        },
      },
    },
    {
      name: 'restrictedValue',
      type: 'text',
      access: {
        create: () => false,
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
