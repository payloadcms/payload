import type { CollectionConfig } from 'payload'

import { slugFieldsSlug } from '../../slugs.js'

const SlugFields: CollectionConfig = {
  slug: slugFieldsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      admin: {
        description: 'URL-friendly identifier, auto-generated from the title',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.title) {
              return (siblingData.title as string)
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^a-z0-9-]/g, '')
            }
            return value
          },
        ],
      },
    },
  ],
}

export default SlugFields
