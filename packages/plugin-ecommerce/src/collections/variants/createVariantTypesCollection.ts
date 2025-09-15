import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, FieldsOverride } from '../../types.js'

type Props = {
  access: {
    adminOnly: NonNullable<AccessConfig['adminOnly']>
    publicAccess: NonNullable<AccessConfig['publicAccess']>
  }
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the variant options collection, defaults to 'variantOptions'.
   */
  variantOptionsSlug?: string
}

export const createVariantTypesCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOnly, publicAccess },
    overrides,
    variantOptionsSlug = 'variantOptions',
  } = props || {}
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
      create: adminOnly,
      delete: adminOnly,
      read: publicAccess,
      update: adminOnly,
      ...overrides?.access,
    },
    admin: {
      group: 'Ecommerce',
      useAsTitle: 'label',
      ...overrides?.admin,
    },
    fields,
    trash: true,
  }

  return { ...baseConfig }
}
