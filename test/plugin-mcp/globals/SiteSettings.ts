import type { GlobalConfig } from 'payload'

import { limitedMCPUserEmail } from '../limitedAccess.js'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    update: ({ req }) => req.user?.email !== limitedMCPUserEmail,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      admin: {
        description: 'The name of the site',
      },
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      admin: {
        description: 'A brief description of the site',
      },
    },
    {
      name: 'maintenanceMode',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Enable or disable maintenance mode',
      },
    },
    {
      name: 'contactEmail',
      type: 'email',
      admin: {
        description: 'Contact email address for the site',
      },
    },
  ],
  versions: false,
}
