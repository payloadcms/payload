import type { CollectionConfig } from 'payload'

export const pointFields: CollectionConfig['fields'] = [
  {
    name: 'pointFieldServerComponent',
    type: 'point',
    admin: {
      components: {
        Field: '@/collections/Fields/point/components/server/Field#CustomPointFieldServer',
        Label: '@/collections/Fields/point/components/server/Label#CustomPointFieldLabelServer',
      },
    },
  },
  {
    name: 'pointFieldClientComponent',
    type: 'point',
    admin: {
      components: {
        Field: '@/collections/Fields/point/components/client/Field#CustomPointFieldClient',
        Label: '@/collections/Fields/point/components/client/Label#CustomPointFieldLabelClient',
      },
    },
  },
]
