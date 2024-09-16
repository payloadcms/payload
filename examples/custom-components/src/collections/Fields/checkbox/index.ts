import type { CollectionConfig } from 'payload'

export const checkboxFields: CollectionConfig['fields'] = [
  {
    name: 'checkboxFieldServerComponent',
    type: 'checkbox',
    admin: {
      components: {
        Field: '@/collections/Fields/checkbox/components/server/Field#CustomCheckboxFieldServer',
        Label:
          '@/collections/Fields/checkbox/components/server/Label#CustomCheckboxFieldLabelServer',
      },
    },
  },
  {
    name: 'checkboxFieldClientComponent',
    type: 'checkbox',
    admin: {
      components: {
        Field: '@/collections/Fields/checkbox/components/client/Field#CustomCheckboxFieldClient',
        Label:
          '@/collections/Fields/checkbox/components/client/Label#CustomCheckboxFieldLabelClient',
      },
    },
  },
]
