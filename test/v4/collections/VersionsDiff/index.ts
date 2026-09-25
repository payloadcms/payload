import type { CollectionConfig } from 'payload'

import { tagsSlug, uploadsSlug, versionsDiffSlug } from '../../slugs.js'

export const VersionsDiff: CollectionConfig = {
  slug: versionsDiffSlug,
  admin: {
    useAsTitle: 'title',
    group: 'Versions',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'arrayText',
          type: 'text',
        },
        {
          name: 'nestedArray',
          type: 'array',
          fields: [
            {
              name: 'nestedText',
              type: 'text',
            },
          ],
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
              name: 'blockText',
              type: 'text',
            },
          ],
        },
        {
          slug: 'numberBlock',
          fields: [
            {
              name: 'blockNumber',
              type: 'number',
            },
          ],
        },
      ],
    },
    {
      name: 'checkbox',
      type: 'checkbox',
    },
    {
      name: 'code',
      type: 'code',
    },
    {
      name: 'date',
      type: 'date',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'nestedText',
          type: 'text',
        },
        {
          name: 'nestedNumber',
          type: 'number',
        },
      ],
    },
    {
      name: 'json',
      type: 'json',
    },
    {
      name: 'number',
      type: 'number',
    },
    {
      name: 'numberMany',
      type: 'number',
      hasMany: true,
    },
    {
      name: 'point',
      type: 'point',
    },
    {
      name: 'radio',
      type: 'radio',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: tagsSlug,
    },
    {
      name: 'relationshipMany',
      type: 'relationship',
      relationTo: tagsSlug,
      hasMany: true,
    },
    {
      name: 'select',
      type: 'select',
      options: [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
        { label: 'Option 3', value: 'option-3' },
      ],
    },
    {
      name: 'selectMany',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
        { label: 'Option 3', value: 'option-3' },
      ],
    },
    {
      name: 'tabs',
      type: 'tabs',
      tabs: [
        {
          label: 'Tab One',
          fields: [
            {
              name: 'tabText',
              type: 'text',
            },
          ],
        },
        {
          label: 'Tab Two',
          fields: [
            {
              name: 'tabNumber',
              type: 'number',
            },
          ],
        },
      ],
    },
    {
      name: 'upload',
      type: 'upload',
      relationTo: uploadsSlug,
    },
    {
      name: 'uploadMany',
      type: 'upload',
      relationTo: uploadsSlug,
      hasMany: true,
    },
  ],
}
