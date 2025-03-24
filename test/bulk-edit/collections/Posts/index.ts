import type { CollectionConfig } from 'payload'

import { postsSlug } from '../../shared.js'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', 'description', '_status'],
    pagination: {
      defaultLimit: 5,
      limits: [5, 10, 15],
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'defaultValueField',
      type: 'text',
      defaultValue: 'This is a default value',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'defaultValueField',
          type: 'text',
          defaultValue: 'This is a default value',
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'optional',
          type: 'text',
        },
        {
          name: 'innerArrayOfFields',
          type: 'array',
          fields: [
            {
              name: 'innerOptional',
              type: 'text',
            },
          ],
        },
        {
          name: 'noRead',
          type: 'text',
          access: {
            read: () => false,
          },
        },
        {
          name: 'noUpdate',
          type: 'text',
          access: {
            update: () => false,
          },
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'textBlock',
          fields: [
            {
              name: 'textFieldForBlock',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'noRead',
      type: 'text',
      access: {
        read: () => false,
      },
    },
    {
      name: 'noUpdate',
      type: 'text',
      access: {
        update: () => false,
      },
    },
  ],
}
