import type { CollectionConfig } from 'payload'

export const CustomListDrawer: CollectionConfig = {
  slug: 'custom-list-drawer',
  fields: [
    {
      name: 'customListDrawer',
      type: 'ui',
      admin: {
        components: {
          Field: '/collections/CustomListDrawer/Component.js#CustomListDrawer',
        },
      },
    },
  ],
}
