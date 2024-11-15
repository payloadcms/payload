import type { CollectionConfig } from 'payload'

export const testsSlug = 'tests'

export const TestsCollection: CollectionConfig = {
  slug: testsSlug,
  admin: {
    useAsTitle: 'text',
  },
  lockDocuments: {
    duration: 5,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
