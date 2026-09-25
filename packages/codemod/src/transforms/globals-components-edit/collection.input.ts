import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    components: {
      Description: '/components/CustomDescription.js#CustomDescription',
      edit: {
        SaveButton: '/components/CustomSave.js#CustomSave',
      },
    },
  },
  fields: [{ name: 'title', type: 'text' }],
}
