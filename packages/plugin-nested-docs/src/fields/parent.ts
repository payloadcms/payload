import type { RelationshipField } from 'payload/dist/fields/config/types'
import type { Field } from 'payload/types'

const createParentField = (relationTo: string, overrides?: Partial<RelationshipField>): Field => ({
  name: 'parent',
  relationTo,
  type: 'relationship',
  maxDepth: 1,
  filterOptions: ({ id }) => ({
    id: { not_equals: id },
    'breadcrumbs.doc': { not_in: [id] },
  }),
  admin: {
    position: 'sidebar',
    ...(overrides?.admin || {}),
  },
  ...(overrides || {}),
})

export default createParentField
