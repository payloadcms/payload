import type { CollectionConfig } from 'payload'

export const serverComponentsSlug = 'server-components'

export const ServerComponentsCollection: CollectionConfig = {
  slug: serverComponentsSlug,
  admin: {
    useAsTitle: 'customTextServer',
  },
  fields: [
    {
      name: 'customTextServer',
      type: 'text',
      admin: {
        components: {
          Field: '/collections/Posts/fields/CustomTextFieldServer.tsx#CustomTextFieldServer',
        },
      },
    },
    {
      name: 'richText',
      type: 'richText',
    },
  ],
}
