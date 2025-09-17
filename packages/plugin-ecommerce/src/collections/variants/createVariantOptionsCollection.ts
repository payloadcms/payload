import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, FieldsOverride } from '../../types.js'

type Props = {
  access: {
    adminOnly: NonNullable<AccessConfig['adminOnly']>
    publicAccess: NonNullable<AccessConfig['publicAccess']>
  }
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the variant types collection, defaults to 'variantTypes'.
   */
  variantTypesSlug?: string
}

export const createVariantOptionsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOnly, publicAccess },
    overrides,
    variantTypesSlug = 'variantTypes',
  } = props || {}
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
