import type { CollectionConfig } from 'payload/types'

export const Pages: CollectionConfig = {
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      required: true,
      type: 'text',
    },
    {
      name: 'form',
      label: 'Form',
      relationTo: 'forms',
      type: 'relationship',
    },
  ],
  labels: {
    plural: 'Pages',
    singular: 'Page',
  },
  slug: 'pages',
}
