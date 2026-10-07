import type { GlobalConfig } from 'payload'

import { linkField } from '../fields'
import { revalidateVigorGlobal } from '../revalidate'

/**
 * The hero carousel at the top of the Vigor website's home page. The rest of the home page comes
 * from the collections: products with a badge, service pages, news and events.
 */
export const VigorHome: GlobalConfig = {
  slug: 'vigor-home',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Vigor website',
  },
  fields: [
    {
      name: 'hero',
      type: 'array',
      fields: [
        {
          name: 'kicker',
          type: 'text',
          admin: {
            description: 'Small line above the title.',
          },
          localized: true,
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'summary',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'image',
          type: 'upload',
          admin: {
            description: 'Wide photo, at least 1600 × 800 pixels.',
          },
          relationTo: 'media',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'ctaLabel',
              type: 'text',
              label: 'Button text',
              localized: true,
              required: true,
            },
            linkField({ name: 'ctaLink', label: 'Button link' }),
          ],
        },
      ],
      label: 'Hero slides',
    },
  ],
  hooks: {
    afterChange: [revalidateVigorGlobal],
  },
  label: 'Home page',
}
