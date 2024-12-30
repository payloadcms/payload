import type { CollectionConfig } from 'payload'

export const emailFields: CollectionConfig['fields'] = [
  {
    name: 'emailFieldServerComponent',
    type: 'email',
    admin: {
      components: {
        Field: '@/collections/Fields/email/components/server/Field#CustomEmailFieldServer',
        Label: '@/collections/Fields/email/components/server/Label#CustomEmailFieldLabelServer',
      },
    },
  },
  {
    name: 'emailFieldClientComponent',
    type: 'email',
    admin: {
      components: {
        Field: '@/collections/Fields/email/components/client/Field#CustomEmailFieldClient',
        Label: '@/collections/Fields/email/components/client/Label#CustomEmailFieldLabelClient',
      },
    },
  },
]
