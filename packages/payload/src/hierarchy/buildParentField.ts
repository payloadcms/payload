import type { SingleRelationshipField } from '../fields/config/types.js'

export const buildParentField = ({
  collectionSlug,
  overrides = {},
  parentFieldName,
}: {
  collectionSlug: string
  overrides?: Partial<SingleRelationshipField>
  parentFieldName: string
}): SingleRelationshipField => {
  const field: SingleRelationshipField = {
    name: parentFieldName,
    type: 'relationship',
    admin: {
      position: 'sidebar',
    },
    hasMany: false,
    index: true,
    label: 'Parent',
    localized: false,
    relationTo: collectionSlug, // Always self-referential
  }

  if (overrides?.admin) {
    field.admin = {
      ...(field.admin || {}),
      ...overrides.admin,
    }

    if (overrides.admin.components && field.admin) {
      field.admin.components = {
        ...(field.admin.components || {}),
        ...overrides.admin.components,
      }
    }
  }

  return field
}
