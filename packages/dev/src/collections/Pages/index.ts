import { CollectionConfig } from 'payload/types'
import { CustomView } from './CustomView'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    components: {
      views: {
        Edit: {
          Custom: {
            path: '/custom',
            Component: CustomView,
            Tab: {
              label: 'Custom View',
              href: '/custom',
            },
          },
        },
      },
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'enableConditionalField',
      label: 'Enable Conditional Field',
      type: 'checkbox',
    },
    {
      name: 'conditionalField',
      label: 'Conditional Field',
      type: 'text',
      admin: {
        condition: (data) => data.enableConditionalField,
      },
    },
    {
      name: 'number',
      label: 'Number',
      type: 'number',
    },
    {
      name: 'select',
      label: 'Select',
      type: 'select',
      options: [
        {
          label: 'Option 1',
          value: 'option-1',
        },
        {
          label: 'Option 2',
          value: 'option-2',
        },
      ],
    },
    {
      name: 'group',
      label: 'Group',
      type: 'group',
      fields: [
        {
          name: 'groupText',
          label: 'Group Text',
          type: 'text',
        },
      ],
    },
  ],
}
