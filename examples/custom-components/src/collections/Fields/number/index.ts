import type { CollectionConfig } from 'payload'

export const numberFields: CollectionConfig['fields'] = [
  {
    name: 'numberFieldServerComponent',
    type: 'number',
    admin: {
      components: {
        Field: '@/collections/Fields/number/components/server/Field#CustomNumberFieldServer',
        Label: '@/collections/Fields/number/components/server/Label#CustomNumberFieldLabelServer',
      },
    },
  },
  {
    name: 'numberFieldClientComponent',
    type: 'number',
    admin: {
      components: {
        Field: '@/collections/Fields/number/components/client/Field#CustomNumberFieldClient',
        Label: '@/collections/Fields/number/components/client/Label#CustomNumberFieldLabelClient',
      },
    },
  },
]
