import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
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
    {
      name: 'socialLinks',
      type: 'array',
      admin: {
        description: 'Social media links',
      },
      fields: [
        {
          name: 'platform',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'allowedDomains',
      type: 'array',
      admin: {
        description: 'List of allowed domains',
      },
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
