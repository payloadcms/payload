import type { CollectionConfig } from 'payload'

export const Autosave: CollectionConfig = {
  slug: 'autosave-with-hooks',
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        data.title = 'reset from beforeChange'

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      type: 'text',
      name: 'slug',
      hooks: {
        beforeValidate: [
          () => {
            return 'reset from beforeValidate'
          },
        ],
      },
    },
  ],
}
