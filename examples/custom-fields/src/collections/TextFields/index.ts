import type { CollectionConfig } from 'payload'

export const TextFields: CollectionConfig = {
  slug: 'text-fields',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'textFieldServerComponent',
      type: 'text',
      admin: {
        components: {
          Field: '@/collections/TextFields/CustomTextFieldServer#CustomTextFieldServer',
        },
      },
    },
    {
      name: 'textFieldClientComponent',
      type: 'text',
      admin: {
        components: {
          Field: '@/collections/TextFields/CustomTextFieldClient#CustomTextFieldClient',
        },
      },
    },
  ],
}
