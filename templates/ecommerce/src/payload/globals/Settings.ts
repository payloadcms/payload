import type { GlobalConfig } from 'payload/types'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'productsPage',
      type: 'relationship',
      label: 'Products page',
      relationTo: 'pages',
    },
  ],
  graphQL: {
    name: 'Settings',
  },
  typescript: {
    interface: 'Settings',
  },
}
