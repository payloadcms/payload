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
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
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
      // A localized slug fed by a non-localized source — every locale shares the same source value.
      name: 'localizedSharedSlug',
      type: 'slug',
      useAsSlug: 'title',
      localized: true,
      required: false,
    },
    {
      name: 'readOnlySlug',
      type: 'slug',
      useAsSlug: 'title',
      required: false,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'sourcelessSlug',
      type: 'slug',
      required: false,
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
