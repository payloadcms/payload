import type { CollectionConfig } from 'payload'

export const textFields: CollectionConfig['fields'] = [
  {
    name: 'textFieldServerComponent',
    type: 'text',
    admin: {
      components: {
        Field: '@/components/fields/Text/server/Field#CustomTextFieldServer',
        Label: '@/components/fields/Text/server/Label#CustomTextFieldLabelServer',
      },
    },
  },
  {
    name: 'textFieldClientComponent',
    type: 'text',
    admin: {
      components: {
        Field: '@/components/fields/Text/client/Field#CustomTextFieldClient',
        Label: '@/components/fields/Text/client/Label#CustomTextFieldLabelClient',
      },
    },
  },
]
