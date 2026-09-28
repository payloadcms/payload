import type { CollectionConfig } from 'payload'

import { MetaDescriptionField, MetaTitleField } from '@payloadcms/plugin-seo/fields'
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { createFolderField } from 'payload'

import { mediaSlug } from '../Media/index.js'

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
      name: 'contrastDisabledSelect',
      type: 'select',
      admin: { readOnly: true },
      defaultValue: ['one', 'two'],
      hasMany: true,
      options: [
        { label: 'Value One', value: 'one' },
        { label: 'Value Two', value: 'two' },
      ],
    },
    {
      name: 'contrastDate',
      type: 'date',
      timezone: true,
    },
    {
      name: 'contrastGroup',
      type: 'group',
      admin: { description: 'Group description for contrast measurement.' },
      fields: [{ name: 'text', type: 'text' }],
    },
    {
      type: 'tabs',
      tabs: [
        { fields: [{ name: 'contrastFirst', type: 'text' }], label: 'Contrast first tab' },
        { fields: [{ name: 'contrastSecond', type: 'text' }], label: 'Contrast second tab' },
      ],
    },
    {
      name: 'contrastUpload',
      type: 'upload',
      admin: { description: 'Choose a media file for this post.' },
      relationTo: mediaSlug,
    },
    {
      name: 'contrastSEO',
      type: 'group',
      fields: [MetaTitleField({}), MetaDescriptionField({})],
      label: 'Contrast SEO',
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
