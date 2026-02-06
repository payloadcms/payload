import type { GlobalConfig } from 'payload'

export const MaxVersions: GlobalConfig = {
  slug: 'max-versions',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    max: 2,
    drafts: true,
  },
}
