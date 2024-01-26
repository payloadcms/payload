import { CollectionConfig } from 'payload/types'

export const KnowledgeGraph: CollectionConfig = {
  slug: 'knowledge-graph',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'resource',
      type: 'relationship',
      relationTo: 'resource',
    },
  ],
}
