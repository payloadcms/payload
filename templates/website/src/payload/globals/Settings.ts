import type { GlobalConfig } from 'payload/types'

export const Settings: GlobalConfig = {
  slug: 'settings',
  typescript: {
    interface: 'Settings',
  },
  graphQL: {
    name: 'Settings',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'postsPage',
      type: 'relationship',
      relationTo: 'posts',
      label: 'Posts page',
    },
    {
      name: 'projectsPage',
      type: 'relationship',
      relationTo: 'projects',
      label: 'Projects page',
    },
  ],
}
