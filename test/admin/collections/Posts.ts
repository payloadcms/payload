import type { CollectionConfig } from 'payload'

import { slateEditor } from '@payloadcms/richtext-slate'

import { slugPluralLabel, slugSingularLabel } from '../shared.js'
import { postsCollectionSlug, uploadCollectionSlug } from '../slugs.js'

export const Posts: CollectionConfig = {
  slug: postsCollectionSlug,
  admin: {
    defaultColumns: ['id', 'number', 'title', 'description', 'demoUIField'],
    description: 'This is a custom collection description.',
    group: 'One',
    listSearchableFields: ['id', 'title', 'description', 'number'],
    components: {
      beforeListTable: [
        '/components/ResetColumns/index.js#ResetDefaultColumnsButton',
        {
          path: '/components/Banner/index.js#Banner',
          clientProps: {
            message: 'BeforeListTable custom component',
          },
        },
      ],
      Description: {
        path: '/components/ViewDescription/index.js#ViewDescription',
      },
      afterListTable: [
        {
          path: '/components/Banner/index.js#Banner',
          clientProps: {
            message: 'AfterListTable custom component',
          },
        },
      ],
      afterList: [
        {
          path: '/components/Banner/index.js#Banner',
          clientProps: {
            message: 'AfterList custom component',
          },
        },
      ],
      beforeList: [
        {
          path: '/components/Banner/index.js#Banner',
          clientProps: {
            message: 'BeforeList custom component',
          },
        },
      ],
    },
    pagination: {
      defaultLimit: 5,
      limits: [5, 10, 15],
    },
    meta: {
      description: 'This is a custom meta description for posts',
      openGraph: {
        description: 'This is a custom OG description for posts',
        title: 'This is a custom OG title for posts',
      },
    },
    preview: () => 'https://payloadcms.com',
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
            {
              name: 'number',
              type: 'number',
            },
            {
              name: 'richText',
              type: 'richText',
              editor: slateEditor({
                admin: {
                  elements: ['relationship'],
                },
              }),
            },
            {
              name: 'demoUIField',
              type: 'ui',
              admin: {
                components: {
                  Cell: '/components/DemoUIField/Cell.js#DemoUIFieldCell',
                  Field: '/components/DemoUIField/Field.js#DemoUIField',
                },
              },
              label: 'Demo UI Field',
            },
          ],
          label: 'Tab 1',
        },
      ],
    },
    {
      name: 'arrayOfFields',
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
      ],
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'defaultValueField',
          type: 'text',
          defaultValue: 'testing',
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      name: 'someBlock',
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
      name: 'defaultValueField',
      type: 'text',
      defaultValue: 'testing',
    },
    {
      name: 'relationship',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'posts',
    },
    {
      name: 'customCell',
      type: 'text',
      admin: {
        components: {
          Cell: '/components/CustomCell/index.js#CustomCell',
        },
      },
    },
    {
      name: 'upload',
      type: 'upload',
      relationTo: uploadCollectionSlug,
    },
    {
      name: 'hiddenField',
      type: 'text',
      hidden: true,
    },
    {
      name: 'adminHiddenField',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'disableListColumnText',
      type: 'text',
      admin: {
        disableListColumn: true,
      },
    },
    {
      name: 'disableListFilterText',
      type: 'text',
      admin: {
        disableListFilter: true,
      },
    },
    {
      name: 'sidebarField',
      type: 'text',
      access: {
        update: () => false,
      },
      admin: {
        description:
          'This is a very long description that takes many characters to complete and hopefully will wrap instead of push the sidebar open, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum voluptates. Quisquam, voluptatum voluptates.',
        position: 'sidebar',
      },
    },
  ],
  labels: {
    plural: slugPluralLabel,
    singular: slugSingularLabel,
  },
  versions: {
    drafts: true,
  },
}
