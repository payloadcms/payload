import type { CollectionConfig } from 'payload'

import { formMediaSlug } from '../Media/index.js'

export const autosavePostsSlug = 'autosave-posts'
export const draftPostsSlug = 'draft-posts'

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
    { name: 'content', type: 'text' },
    { name: 'slug', type: 'slug', required: false, useAsSlug: 'title' },
    { name: 'media', type: 'upload', relationTo: formMediaSlug },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'text',
          fields: [{ name: 'text', type: 'text' }],
        },
      ],
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

export const DraftPostsCollection: CollectionConfig = {
  ...AutosavePostsCollection,
  slug: draftPostsSlug,
  versions: { drafts: true },
}
