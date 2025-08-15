import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, FieldsOverride } from '../types.js'

type Props = {
  isAdmin: NonNullable<AccessConfig['isAdmin']>
  isPublic: NonNullable<AccessConfig['isPublic']>
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the variant types collection, defaults to 'variantTypes'.
   */
  variantTypesSlug?: string
}

export const variantOptionsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { isAdmin, isPublic, overrides, variantTypesSlug = 'variantTypes' } = props || {}
  const fieldsOverride = overrides?.fields

  const variantOptionsDefaultFields: Field[] = [
    {
      name: 'variantType',
      type: 'relationship',
      admin: {
        readOnly: true,
      },
      relationTo: variantTypesSlug,
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'value',
      type: 'text',
      admin: {
        description: 'should be defaulted or dynamic based on label',
      },
      required: true,
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields: variantOptionsDefaultFields })
      : variantOptionsDefaultFields

  const baseConfig: CollectionConfig = {
    slug: 'variantOptions',
    ...overrides,
    access: {
      create: isAdmin,
      delete: isAdmin,
      read: isPublic,
      update: isAdmin,
      ...overrides?.access,
    },
    admin: {
      group: 'Ecommerce',
      useAsTitle: 'label',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
