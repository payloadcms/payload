import type { CollectionConfig } from 'payload'

export const arrayFields: CollectionConfig['fields'] = [
  {
    name: 'arrayFieldServerComponent',
    type: 'array',
    admin: {
      components: {
        Field: '@/collections/Fields/array/components/server/Field#CustomArrayFieldServer',
        Label: '@/collections/Fields/array/components/server/Label#CustomArrayFieldLabelServer',
      },
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
      },
    ],
  },
  {
    name: 'arrayFieldClientComponent',
    type: 'array',
    admin: {
      components: {
        Field: '@/collections/Fields/array/components/client/Field#CustomArrayFieldClient',
        Label: '@/collections/Fields/array/components/client/Label#CustomArrayFieldLabelClient',
      },
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
      },
    ],
  },
]
