import type { CollectionConfig } from 'payload'

export const dateFields: CollectionConfig['fields'] = [
  {
    name: 'dateFieldServerComponent',
    type: 'date',
    admin: {
      components: {
        Field: '@/collections/Fields/date/components/server/Field#CustomDateFieldServer',
        Label: '@/collections/Fields/date/components/server/Label#CustomDateFieldLabelServer',
      },
    },
  },
  {
    name: 'dateFieldClientComponent',
    type: 'date',
    admin: {
      components: {
        Field: '@/collections/Fields/date/components/client/Field#CustomDateFieldClient',
        Label: '@/collections/Fields/date/components/client/Label#CustomDateFieldLabelClient',
      },
    },
  },
]
