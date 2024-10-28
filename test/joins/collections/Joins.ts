import { joinDocsSlug } from '../shared.js'

export const JoinDocs: any = {
  slug: joinDocsSlug,
  admin: {
    useAsTitle: 'title',
    description: 'A collection with a join to relating collection',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'relationship',
      type: 'join',
      collection: 'relationship-docs',
      on: 'relationship',
    },
  ],
}
