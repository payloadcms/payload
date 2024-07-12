import type { SingleRelationshipField } from 'payload'

export const createParentField = (
  relationTo: string,
  overrides?: Partial<
    {
      hasMany: false
    } & SingleRelationshipField
  >,
): SingleRelationshipField => ({
  name: 'parent',
  admin: {
    position: 'sidebar',
    ...(overrides?.admin || {}),
  },
  // filterOptions are assigned dynamically based on the pluginConfig
  // filterOptions: parentFilterOptions(),
  type: 'relationship',
  maxDepth: 1,
  relationTo,
  ...(overrides || {}),
})
