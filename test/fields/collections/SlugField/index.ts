import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

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
    slugField(),
    {
      name: 'localizedTitle',
      type: 'text',
      localized: true,
    },
    slugField({
      slugify: (value) => value?.toUpperCase(),
      name: 'customSlugify',
    }),
    slugField({
      fieldToUse: 'localizedTitle',
      name: 'localizedSlug',
      localized: true,
      required: false,
    }),
  ],
}

export default SlugField
