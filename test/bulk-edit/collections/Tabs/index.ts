import type { CollectionConfig } from 'payload'

import { tabsSlug } from '../../shared.js'

export const TabsCollection: CollectionConfig = {
  slug: tabsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'text',
      name: 'title',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tabs Tabs Array',
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  name: 'tabTab',
                  fields: [
                    {
                      name: 'tabTabArray',
                      type: 'array',
                      fields: [
                        {
                          name: 'tabTabArrayText',
                          type: 'text',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
