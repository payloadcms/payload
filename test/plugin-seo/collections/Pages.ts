import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../shared.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
            },
            {
              name: 'excerpt',
              label: 'Excerpt',
              type: 'text',
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              // NOTE: in order for position: 'sidebar' to work here,
              // the first field of this config must be of type `tabs`,
              // and this field must be a sibling of it
              // See `./Posts` or the `../../README.md` for more info
              admin: {
                position: 'sidebar',
              },
            },
          ],
        },
      ],
    },
  ],
}
