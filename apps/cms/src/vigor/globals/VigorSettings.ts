import type { GlobalConfig } from 'payload'

import { linkField } from '../fields'
import { revalidateVigorGlobal } from '../revalidate'

/** Company details, main menu and key figures of the Vigor website */
export const VigorSettings: GlobalConfig = {
  slug: 'vigor-settings',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Vigor website',
  },
  fields: [
    {
      name: 'company',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'shortName',
              type: 'text',
              admin: {
                description: 'Used in "Ask Vigor AI".',
              },
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'portalName',
              type: 'text',
              admin: {
                description: 'Shown under the logo, e.g. Online Wholesale Portal',
              },
              localized: true,
            },
            {
              name: 'tagline',
              type: 'text',
              admin: {
                description: 'Shown in the top bar and the footer.',
              },
              localized: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
            {
              name: 'phone',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'address',
              type: 'text',
              localized: true,
            },
            {
              name: 'hours',
              type: 'text',
              label: 'Opening hours',
              localized: true,
            },
          ],
        },
        {
          name: 'social',
          type: 'group',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'linkedin',
                  type: 'text',
                  label: 'LinkedIn URL',
                },
                {
                  name: 'instagram',
                  type: 'text',
                  label: 'Instagram URL',
                },
                {
                  name: 'facebook',
                  type: 'text',
                  label: 'Facebook URL',
                },
              ],
            },
          ],
          label: 'Social media',
        },
      ],
    },
    {
      name: 'nav',
      type: 'array',
      admin: {
        description: '"Home" is added automatically.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
            },
            linkField({ name: 'link', label: 'Link' }),
          ],
        },
      ],
      label: 'Main menu',
    },
    {
      name: 'stats',
      type: 'array',
      admin: {
        description: 'Shown on the home and About pages.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              admin: {
                description: 'e.g. 25+',
              },
              required: true,
            },
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
            },
          ],
        },
      ],
      label: 'Key figures',
    },
  ],
  hooks: {
    afterChange: [revalidateVigorGlobal],
  },
  label: 'Site settings',
  typescript: {
    interface: 'VigorSettings',
  },
}
