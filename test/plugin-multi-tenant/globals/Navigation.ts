import type { CollectionConfig } from 'payload'

export const NavigationGlobalCollection: CollectionConfig = {
  slug: 'navigation-global',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
