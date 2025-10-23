import type { CollectionConfig } from 'payload'

export const codeFields: CollectionConfig['fields'] = [
  {
    name: 'codeFieldServerComponent',
    type: 'code',
    admin: {
      components: {
        Field: '@/collections/Fields/code/components/server/Field#CustomCodeFieldServer',
        Label: '@/collections/Fields/code/components/server/Label#CustomCodeFieldLabelServer',
      },
    },
  },
  {
    name: 'codeFieldClientComponent',
    type: 'code',
    admin: {
      components: {
        Field: '@/collections/Fields/code/components/client/Field#CustomCodeFieldClient',
        Label: '@/collections/Fields/code/components/client/Label#CustomCodeFieldLabelClient',
      },
    },
  },
]
