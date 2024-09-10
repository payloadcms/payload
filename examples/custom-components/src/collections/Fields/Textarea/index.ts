import type { CollectionConfig } from 'payload'

export const textareaFields: CollectionConfig['fields'] = [
  {
    name: 'textareaFieldServerComponent',
    type: 'textarea',
    admin: {
      components: {
        Field: '@/components/fields/Textarea/server/Field#CustomTextareaFieldServer',
        Label: '@/components/fields/Textarea/server/Label#CustomTextareaFieldLabelServer',
      },
    },
  },
  {
    name: 'textareaFieldClientComponent',
    type: 'textarea',
    admin: {
      components: {
        Field: '@/components/fields/Textarea/client/Field#CustomTextareaFieldClient',
        Label: '@/components/fields/Textarea/client/Label#CustomTextareaFieldLabelClient',
      },
    },
  },
]
