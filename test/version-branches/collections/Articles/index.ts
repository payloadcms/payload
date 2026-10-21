import type { CollectionConfig } from 'payload'

import { articlesSlug } from '../../slugs.js'

export const Articles: CollectionConfig = {
  slug: articlesSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    readVersions: () => true,
    update: () => true,
  },
  fields: [
    { name: 'shared', type: 'text' },
    { name: 'title', type: 'text', localized: true, required: true },
    {
      name: 'sections',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'translation', type: 'text', localized: true },
      ],
    },
  ],
  versions: { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 1000 },
}
