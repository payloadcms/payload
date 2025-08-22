import type { Block } from 'payload'

export const RelationshipBlock: Block = {
  slug: 'relationshipBlock',
  interfaceName: 'RelationshipBlock',
  fields: [
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: 'posts',
    },
  ],
}
