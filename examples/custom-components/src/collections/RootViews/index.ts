import type { CollectionConfig } from 'payload'

export const CustomRootViews: CollectionConfig = {
  slug: 'custom-root-views',
  admin: {
    components: {
      views: {
        edit: {
          root: {
            Component: '@/collections/RootViews/components/CustomRootEditView#CustomRootEditView',
          },
        },
      },
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
  ],
}
