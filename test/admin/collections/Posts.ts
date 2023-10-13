import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { slateEditor } from '../../../packages/richtext-slate/src'
import DemoUIFieldCell from '../components/DemoUIField/Cell'
import DemoUIFieldField from '../components/DemoUIField/Field'
import { postsSlug, slugPluralLabel, slugSingularLabel } from '../shared'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  labels: {
    singular: slugSingularLabel,
    plural: slugPluralLabel,
  },
  admin: {
    description: 'Description',
    listSearchableFields: ['title', 'description', 'number'],
    group: 'One',
    useAsTitle: 'title',
    defaultColumns: ['id', 'number', 'title', 'description', 'demoUIField'],
    preview: () => 'https://payloadcms.com',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab 1',
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
              type: 'ui',
              name: 'demoUIField',
              label: 'Demo UI Field',
              admin: {
                components: {
                  Field: DemoUIFieldField,
                  Cell: DemoUIFieldCell,
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'sidebarField',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'This is a very long description that takes many characters to complete and hopefully will wrap instead of push the sidebar open, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum voluptates. Quisquam, voluptatum voluptates.',
      },
    },
  ],
}
