import type { GlobalConfig } from 'payload'

import { isAdmin, signedIn } from '../../access.js'

export const PlaygroundSettings: GlobalConfig = {
  slug: 'playground-settings',
  access: { read: signedIn, update: isAdmin },
  admin: {
    description: 'Sample app settings for the community demo.',
    group: 'Admin',
  },
  fields: [
    { name: 'siteName', type: 'text', defaultValue: 'Northstar Field Co.' },
    { name: 'announcement', type: 'textarea', localized: true },
    {
      name: 'features',
      type: 'group',
      fields: [
        { name: 'showEvents', type: 'checkbox', defaultValue: true },
        { name: 'showCatalog', type: 'checkbox', defaultValue: true },
      ],
    },
    { name: 'notes', type: 'textarea' },
  ],
}
