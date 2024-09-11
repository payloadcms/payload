import type { CollectionConfig } from 'payload'

export const CustomViews: CollectionConfig = {
  slug: 'custom-views',
  admin: {
    components: {
      views: {
        edit: {
          customView: {
            Component: '@/collections/Views/components/CustomTabEditView#CustomTabEditView',
            path: '/custom-tab',
            tab: {
              href: '/custom-tab',
              label: 'Custom Tab',
            },
          },
          default: {
            Component: '@/collections/Views/components/CustomDefaultEditView#CustomDefaultEditView',
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
