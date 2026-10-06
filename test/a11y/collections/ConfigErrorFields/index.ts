import type { CollectionConfig } from 'payload'

export const configErrorFieldsSlug = 'config-error-fields'

export const ConfigErrorFieldsCollection: CollectionConfig = {
  slug: configErrorFieldsSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        components: {
          Label: '/components/ConfigComponentErrors/index.js#BrokenServerComponent',
        },
      },
      required: true,
    },
    {
      name: 'customField',
      type: 'text',
      admin: {
        components: {
          Field: '/components/ConfigComponentErrors/index.js#BrokenServerComponent',
        },
      },
      defaultValue: 'Preserved custom field value',
    },
  ],
}
