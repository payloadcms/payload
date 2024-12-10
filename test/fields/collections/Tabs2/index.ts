import type { CollectionConfig } from 'payload'

import { tabsFields2Slug } from '../../slugs.js'

export const TabsFields2: CollectionConfig = {
  slug: tabsFields2Slug,
  fields: [
    {
      name: 'tabsInArray',
      type: 'array',
      fields: [
        {
          type: 'tabs',
          label: 'tabs',
          tabs: [
            {
              label: 'tab1',
              fields: [
                {
                  type: 'text',
                  name: 'text',
                },
              ],
            },
            {
              name: 'tab2',
              fields: [
                {
                  type: 'text',
                  name: 'text2',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
