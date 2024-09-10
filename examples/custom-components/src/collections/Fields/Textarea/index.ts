import type { CollectionConfig } from 'payload'

export const textareaFields: CollectionConfig['fields'] = [
  {
    name: 'title',
    type: 'text',
    label: 'Title',
  },
  {
    name: 'textareaFieldServerComponent',
    type: 'textarea',
    admin: {
      components: {
        Field: '@/collections/TextareaFields/server/Field#CustomTextareaFieldServer',
        Label: '@/collections/TextareaFields/server/Label#CustomTextareaFieldLabelServer',
      },
    },
  },
  {
    name: 'textareaFieldClientComponent',
    type: 'textarea',
    admin: {
      components: {
        Field: '@/collections/TextareaFields/client/Field#CustomTextareaFieldClient',
        Label: '@/collections/TextareaFields/client/Label#CustomTextareaFieldLabelClient',
      },
    },
  },
]
