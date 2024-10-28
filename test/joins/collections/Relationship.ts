import { postsSlug, relationshipDocsSlug } from '../shared.js'

export const RelationshipDocs: any = {
  slug: relationshipDocsSlug,
  admin: {
    useAsTitle: 'title',
    description: 'A collection with a relationship to a collection with a join field',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'joinRelationship',
      type: 'relationship',
      relationTo: 'join-docs',
      description: 'Relationship field to a collection with a join field',
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: postsSlug,
      admin: {
        description: 'Normal relationship field for comparison',
      },
    },
  ],
}
