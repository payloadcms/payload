import type { CollectionConfig } from 'payload'

export const CustomViews: CollectionConfig = {
  slug: 'custom-views',
  admin: {
    components: {
      views: {
        edit: {
          customView: {
            Component: '@/components/views/collection/CustomTabEditView#CustomTabEditView',
            path: '/custom-tab',
            tab: {
              href: '/custom-tab',
              label: 'Custom Tab',
            },
          },
          default: {
            Component: '@/components/views/collection/CustomDefaultEditView#CustomDefaultEditView',
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
