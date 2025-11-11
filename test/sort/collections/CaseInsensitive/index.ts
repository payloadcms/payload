import type { CollectionConfig } from 'payload'

export const caseInsensitiveSlug = 'case-insensitive'

export const CaseInsensitiveCollection: CollectionConfig = {
  slug: caseInsensitiveSlug,
  admin: {
    useAsTitle: 'filename',
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      admin: {
        sortCaseInsensitive: true,
      },
    },
    {
      name: 'normalText',
      type: 'text',
    },
  ],
}
