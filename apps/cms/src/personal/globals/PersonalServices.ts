import type { GlobalConfig } from 'payload'

import { revalidateWebsiteGlobal } from '../../hooks/revalidateWebsite'
import {
  buttonField,
  iconField,
  pageTitleRow,
  personalWebsiteGroup,
  richTextField,
  seoField,
} from '../fields'

/**
 * The personal website's Services page (/services): an introduction next to a tile per service.
 * Until it's saved, the website shows content/services.md.
 */
export const PersonalServices: GlobalConfig = {
  slug: 'personal-services',
  access: {
    read: () => true,
  },
  admin: {
    group: personalWebsiteGroup,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            pageTitleRow({ subtitle: 'My Expertise', title: 'Services' }),
            richTextField({ name: 'intro', label: 'Introduction' }),
            buttonField(),
          ],
          label: 'Introduction',
        },
        {
          fields: [
            {
              name: 'services',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      admin: {
                        description: 'e.g. Web and Mobile App Development',
                      },
                      required: true,
                    },
                    iconField(),
                  ],
                },
                richTextField({ name: 'text' }),
              ],
              labels: {
                plural: 'Services',
                singular: 'Service',
              },
            },
          ],
          label: 'Services',
        },
        {
          fields: [seoField],
          label: 'SEO',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateWebsiteGlobal],
  },
  label: 'Services page',
  typescript: {
    interface: 'PersonalServices',
  },
}
