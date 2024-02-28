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
  admin: {
    position: 'sidebar',
    ...(overrides?.admin || {}),
  },
  // filterOptions are assigned dynamically based on the pluginConfig
  // filterOptions: parentFilterOptions(),
  maxDepth: 1,
  relationTo,
  type: 'relationship',
  ...(overrides || {}),
})

export default createParentField
