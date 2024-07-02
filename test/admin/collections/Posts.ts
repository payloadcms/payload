import type { CollectionConfig } from 'payload'

import { slateEditor } from '@payloadcms/richtext-slate'

import { CustomCell } from '../components/CustomCell/index.js'
import { DemoUIFieldCell } from '../components/DemoUIField/Cell.js'
import { DemoUIField } from '../components/DemoUIField/Field.js'
import { FieldDescriptionComponent } from '../components/FieldDescription/index.js'
import { slugPluralLabel, slugSingularLabel } from '../shared.js'
import { postsCollectionSlug } from '../slugs.js'

export const Posts: CollectionConfig = {
  slug: postsCollectionSlug,
  admin: {
    defaultColumns: ['id', 'number', 'title', 'description', 'demoUIField'],
    description: 'Description',
    group: 'One',
    listSearchableFields: ['id', 'title', 'description', 'number'],
    preview: () => 'https://payloadcms.com',
    useAsTitle: 'title',
    meta: {
      description: 'This is a custom meta description for posts',
      openGraph: {
        title: 'This is a custom OG title for posts',
        description: 'This is a custom OG description for posts',
      },
    },
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
                  Cell: DemoUIFieldCell,
                  Field: DemoUIField,
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
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
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
          Cell: CustomCell,
        },
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
    {
      name: 'descriptionAsString',
      type: 'text',
      admin: {
        description: 'Static field description.',
      },
    },
    {
      name: 'descriptionAsFunction',
      type: 'text',
      admin: {
        description: () => 'Function description',
      },
    },
    {
      name: 'descriptionAsComponent',
      type: 'text',
      admin: {
        components: {
          Description: FieldDescriptionComponent,
        },
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
