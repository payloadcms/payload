import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../shared.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  access: {
    read: ({ req }) =>
      req.user?.email === 'editor@example.com'
        ? {
            title: {
              equals: 'Readable page',
            },
          }
        : true,
  },
  hooks: {
    afterRead: [
      ({ doc, req }) => {
        if (req.user?.email === 'editor@example.com' && doc.title === 'Test page') {
          throw new Error('Read hooks should not run for an inaccessible document')
        }

        return doc
      },
    ],
  },
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'title',
  },
  trash: true,
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
            {
              name: 'featuredMedia',
              type: 'relationship',
              relationTo: 'media',
              hooks: {
                afterChange: [
                  ({ previousValue, value, req }) => {
                    if (
                      previousValue === value &&
                      previousValue !== null &&
                      previousValue !== undefined
                    ) {
                      req.context.identicalCount = ((req.context.identicalCount as number) || 0) + 1
                    }

                    return value
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
}
