import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { slugFieldAutosaveSlug } from './shared.js'

const SlugFieldAutosave: CollectionConfig = {
  slug: slugFieldAutosaveSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    slugField(),
    slugField({
      name: 'customSlugify',
      checkboxName: 'generateCustomSlug',
      required: false,
      slugify: ({ valueToSlugify }) => (valueToSlugify ?? '').toUpperCase(),
    }),
  ],
  versions: {
    drafts: {
      autosave: true,
    },
  },
}

export default SlugFieldAutosave
