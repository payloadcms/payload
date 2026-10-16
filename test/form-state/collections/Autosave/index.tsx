import type { CollectionConfig } from 'payload'

import { autosavePostsSlug, draftPostsSlug } from '../../slugs.js'
import { uploadsSlug } from '../Uploads/index.js'

export { autosavePostsSlug, draftPostsSlug } from '../../slugs.js'

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
      name: 'programmaticValue',
      type: 'text',
    },
    { name: 'content', type: 'text' },
    { name: 'slug', type: 'slug', required: false, useAsSlug: 'title' },
    { name: 'media', type: 'upload', relationTo: uploadsSlug },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'text',
          fields: [{ name: 'text', type: 'text' }],
        },
        {
          slug: 'number',
          fields: [{ name: 'number', type: 'number' }],
        },
      ],
      hooks: {
        beforeChange: [
          ({ value }) =>
            Array.isArray(value)
              ? value
                  .filter((block) => block.text !== 'Remove on server')
                  .map((block) =>
                    block.text === 'Replace on server'
                      ? { id: block.id, blockType: 'number', number: 42 }
                      : block,
                  )
              : value,
        ],
      },
    },
    {
      name: 'groups',
      type: 'array',
      admin: { components: { RowLabel: './collections/Posts/ArrayRowLabel.js#ArrayRowLabel' } },
      fields: [
        { name: 'text', type: 'text' },
        {
          name: 'localState',
          type: 'ui',
          admin: {
            components: { Field: './collections/Autosave/LocalRowState/index.js#LocalRowState' },
          },
        },
        {
          name: 'items',
          type: 'array',
          fields: [{ name: 'text', type: 'text' }],
          hooks: {
            beforeChange: [
              ({ value }) =>
                Array.isArray(value)
                  ? value.filter((item) => item.text !== 'Remove on server')
                  : value,
            ],
          },
        },
      ],
      hooks: {
        beforeChange: [
          ({ value }) =>
            Array.isArray(value)
              ? value.filter((group) => group.text !== 'Remove on server')
              : value,
        ],
      },
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
