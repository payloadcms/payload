import type { CollectionConfig } from 'payload'

import { slugFieldSlug } from './shared.js'

const SlugField: CollectionConfig = {
  slug: slugFieldSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    { name: 'slug', type: 'slug' },
    {
      name: 'localizedTitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'customSlugify',
      type: 'slug',
      slugify: ({ valueToSlugify }) => valueToSlugify?.toUpperCase(),
      useAsSlug: 'title',
      required: true,
    },
    {
      name: 'localizedSlug',
      type: 'slug',
      useAsSlug: 'localizedTitle',
      localized: true,
      required: false,
    },
    {
      name: 'readOnlySlug',
      type: 'slug',
      required: false,
      admin: {
        readOnly: true,
      },
    },
    {
      type: 'text',
      name: 'test',
      admin: {
        readOnly: true,
      },
    },
  ],
  versions: false,
}

export default SlugField
