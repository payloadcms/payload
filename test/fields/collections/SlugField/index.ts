import type { CollectionConfig, TextField } from 'payload'

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
      slugify: ({ valueToSlugify }) => valueToSlugify?.toUpperCase(),
      name: 'customSlugify',
      checkboxName: 'generateCustomSlug',
    }),
    slugField({
      useAsSlug: 'localizedTitle',
      name: 'localizedSlug',
      localized: true,
      required: false,
      checkboxName: 'generateLocalizedSlug',
    }),
    slugField({
      name: 'readOnlySlug',
      checkboxName: 'generateReadOnlySlug',
      required: false,
      overrides: (defaultField) => {
        ;(defaultField.fields[1] as TextField).admin!.readOnly = true

        return defaultField
      },
    }),
    {
      type: 'text',
      name: 'test',
      admin: {
        readOnly: true,
      },
    },
  ],
}

export default SlugField
