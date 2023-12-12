import type { SingleRelationshipField } from 'payload/types'

export const createParentField = (
  relationTo: string,
  overrides?: Partial<
    SingleRelationshipField & {
      hasMany: false
    }
  >,
): SingleRelationshipField => ({
  name: 'parent',
  relationTo,
  type: 'relationship',
  maxDepth: 1,
  filterOptions: ({ id }) => {
    if (id) {
      return {
        id: { not_equals: id },
        'breadcrumbs.doc': { not_in: [id] },
      }
    }

    return null
  },
  admin: {
    position: 'sidebar',
    ...(overrides?.admin || {}),
  },
  ...(overrides || {}),
})

export default createParentField
