import type { GlobalConfig } from 'payload/types'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'postsPage',
      type: 'relationship',
      label: 'Posts page',
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
