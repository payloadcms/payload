import type { GlobalConfig } from 'payload/types'

const Settings: GlobalConfig = {
  slug: 'settings',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'text',
    },
  ],
}

export default Settings
