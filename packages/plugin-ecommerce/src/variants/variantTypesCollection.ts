import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, FieldsOverride } from '../types.js'

type Props = {
  isAdmin: NonNullable<AccessConfig['isAdmin']>
  isPublic: NonNullable<AccessConfig['isPublic']>
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the variant options collection, defaults to 'variantOptions'.
   */
  variantOptionsSlug?: string
}

export const variantTypesCollection: (props?: Props) => CollectionConfig = (props) => {
  const { isAdmin, isPublic, overrides, variantOptionsSlug = 'variantOptions' } = props || {}
  const fieldsOverride = overrides?.fields

  const variantTypesDefaultFields: Field[] = [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'options',
      type: 'join',
      collection: variantOptionsSlug,
      maxDepth: 2,
      on: 'variantType',
      orderable: true,
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields: variantTypesDefaultFields })
      : variantTypesDefaultFields

  const baseConfig: CollectionConfig = {
    slug: 'variantTypes',
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
