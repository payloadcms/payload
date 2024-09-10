import type { CollectionConfig } from 'payload'

export const textFields: CollectionConfig['fields'] = [
  {
    name: 'textFieldServerComponent',
    type: 'text',
    admin: {
      components: {
        Field: '@/collections/TextFields/server/Field#CustomTextFieldServer',
        Label: '@/collections/TextFields/server/Label#CustomTextFieldLabelServer',
      },
    },
  },
  {
    name: 'textFieldClientComponent',
    type: 'text',
    admin: {
      components: {
        Field: '@/collections/TextFields/client/Field#CustomTextFieldClient',
        Label: '@/collections/TextFields/client/Label#CustomTextFieldLabelClient',
      },
    },
  },
]
