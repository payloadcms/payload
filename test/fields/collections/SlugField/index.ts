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
      useAsSlug: 'localizedTitle',
      name: 'localizedSlug',
      checkboxName: 'generateLocalizedSlug',
      localized: true,
      required: false,
    }),
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'nestedTitle',
          type: 'text',
        },
        slugField({
          useAsSlug: 'nestedTitle',
          name: 'nestedSlug',
          checkboxName: 'generateNestedSlug',
        }),
      ],
    },
  ],
}

export default SlugField
