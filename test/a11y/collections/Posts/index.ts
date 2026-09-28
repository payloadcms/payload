import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { createFolderField } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    defaultColumns: ['title', 'accessibilitySelect', 'updatedAt'],
    livePreview: {
      url: ({ data }) => `http://localhost:${process.env.PORT || 3000}/preview/${data?.id || ''}`,
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: {
        description:
          'A subtitle field to test focus indicators in the admin UI, helps us detect exiting out of rich text editor properly.',
      },
    },
    {
      name: 'accessibilitySelect',
      type: 'select',
      defaultValue: 'one',
      options: [
        { label: 'Value One', value: 'one' },
        { label: 'Value Two', value: 'two' },
      ],
    },
    {
      name: 'accessibilitySortableSelect',
      type: 'select',
      admin: {
        isSortable: true,
      },
      defaultValue: ['one', 'two'],
      hasMany: true,
      options: [
        { label: 'Value One', value: 'one' },
        { label: 'Value Two', value: 'two' },
      ],
    },
    {
      name: 'accessibilityDisabledSelect',
      type: 'select',
      admin: {
        readOnly: true,
      },
      defaultValue: 'one',
      options: [
        { label: 'Value One', value: 'one' },
        { label: 'Value Two', value: 'two' },
      ],
    },
    {
      name: 'relatedPost',
      type: 'relationship',
      relationTo: postsSlug,
    },
    {
      name: 'publishedOn',
      type: 'date',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
        },
        {
          name: 'date',
          type: 'date',
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        {
          slug: 'textBlock',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'date',
              type: 'date',
            },
          ],
          labels: {
            plural: 'Text blocks',
            singular: 'Text block',
          },
        },
        {
          slug: 'imageBlock',
          fields: [
            {
              name: 'alt',
              type: 'text',
            },
          ],
          labels: {
            plural: 'Image blocks',
            singular: 'Image block',
          },
        },
      ],
    },
    createFolderField({ relationTo: 'payload-folders' }),
  ],
  trash: true,
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
