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
  ],
}
