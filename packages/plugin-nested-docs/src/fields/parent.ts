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
  // @ts-expect-error - translations are not typed in plugins yet
  label: ({ t }) => t('plugin-nested-docs:parent'),
  // filterOptions are assigned dynamically based on the pluginConfig
  // filterOptions: parentFilterOptions(),
  type: 'relationship',
  maxDepth: 1,
  relationTo,
  ...(overrides || {}),
})
