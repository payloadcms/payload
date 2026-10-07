import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  lexicalEditor,
  TableFeature,
} from '@payloadcms/richtext-lexical'
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
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: {
        components: { Cell: '/components/GridCell/index.js#GridCell' },
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
      required: true,
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
      name: 'requiredTags',
      type: 'text',
      defaultValue: ['initial'],
      hasMany: true,
      required: true,
    },
    {
      name: 'nonSearchableSelect',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/NonSearchableSelect/index.js#NonSearchableSelect',
        },
      },
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
      defaultValue: {
        root: {
          type: 'root',
          children: [
            {
              type: 'block',
              fields: { blockType: 'callout', text: 'First callout' },
              format: '',
              version: 2,
            },
            {
              type: 'block',
              fields: { blockType: 'callout', text: 'Second callout' },
              format: '',
              version: 2,
            },
            { type: 'paragraph', children: [], direction: null, format: '', indent: 0, version: 1 },
          ],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          TableFeature(),
          BlocksFeature({
            blocks: [
              { slug: 'callout', fields: [{ name: 'text', type: 'text' }] },
              {
                slug: 'noHandle',
                admin: {
                  components: {
                    Block: '/components/NoDragHandleBlock/index.js#NoDragHandleBlock',
                  },
                },
                fields: [],
                labels: { plural: 'No handle blocks', singular: 'No handle block' },
              },
            ],
          }),
        ],
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
              name: 'body',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
              }),
            },
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
    {
      type: 'collapsible',
      fields: [{ name: 'publishingNote', type: 'text' }],
      label: 'Publishing details',
    },
    {
      type: 'collapsible',
      admin: {
        components: { Label: '/components/CustomCollapsibleLabel/index.js#CustomCollapsibleLabel' },
      },
      fields: [{ name: 'customLabelNote', type: 'text' }],
    },
    createFolderField({ relationTo: 'payload-folders' }),
    {
      name: 'readOnlyHierarchy',
      type: 'relationship',
      admin: {
        components: { Field: '@payloadcms/ui/rsc#HierarchyField' },
        readOnly: true,
      },
      hasMany: true,
      relationTo: 'payload-folders',
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: mediaSlug,
    },
    {
      name: 'location',
      type: 'point',
    },
    {
      name: 'settings',
      type: 'json',
    },
    {
      name: 'source',
      type: 'code',
    },
    {
      name: 'unlabelledSettings',
      type: 'json',
      admin: {
        disabled: { bulkEdit: true, column: true, filter: true, groupBy: true },
      },
      label: false,
    },
    {
      name: 'unlabelledSource',
      type: 'code',
      admin: {
        disabled: { bulkEdit: true, column: true, filter: true, groupBy: true },
      },
      label: false,
    },
  ],
  llmInstructions: 'Use descriptive post titles.',
  trash: true,
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
