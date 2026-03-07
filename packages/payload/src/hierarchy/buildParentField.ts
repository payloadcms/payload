import type { SingleRelationshipField } from '../fields/config/types.js'

export const buildParentField = ({
  collectionSlug,
  injectHeaderButton = false,
  overrides = {},
  parentFieldName,
}: {
  collectionSlug: string
  injectHeaderButton?: boolean
  overrides?: Partial<SingleRelationshipField>
  parentFieldName: string
}): SingleRelationshipField => {
  const field: SingleRelationshipField = {
    name: parentFieldName,
    type: 'relationship',
    admin: {
      // Use NullField to completely remove from DOM when header button handles the UI
      ...(injectHeaderButton && {
        components: {
          Field: '@payloadcms/ui#NullField',
        },
      }),
      position: 'sidebar',
    },
    hasMany: false,
    index: true,
    label: 'Parent',
    localized: false,
    relationTo: collectionSlug, // Always self-referential
    ...(injectHeaderButton && {
      custom: {
        hierarchy: {
          // Inform hierarchy UI to inject the header button for this parent field
          injectHeaderButton: true,
        },
      },
    }),
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
