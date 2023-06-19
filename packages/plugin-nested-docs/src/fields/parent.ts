import type { RelationshipField } from 'payload/dist/fields/config/types'

const createParentField = (
  relationTo: string,
  overrides?: Partial<
    RelationshipField & {
      hasMany: false
    }
  >,
): RelationshipField => ({
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
