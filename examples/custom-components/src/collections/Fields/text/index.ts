import type { CollectionConfig } from 'payload'

export const textFields: CollectionConfig['fields'] = [
  {
    name: 'textFieldServerComponent',
    type: 'text',
    admin: {
      components: {
        Field: '@/collections/Fields/text/components/server/Field#CustomTextFieldServer',
        Label: '@/collections/Fields/text/components/server/Label#CustomTextFieldLabelServer',
      },
    },
  },
  {
    name: 'textFieldClientComponent',
    type: 'text',
    admin: {
      components: {
        Field: '@/collections/Fields/text/components/client/Field#CustomTextFieldClient',
        Label: '@/collections/Fields/text/components/client/Label#CustomTextFieldLabelClient',
      },
    },
  },
]
