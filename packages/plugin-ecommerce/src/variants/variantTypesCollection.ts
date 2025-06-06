import type { CollectionConfig, Field } from 'payload'

import type { FieldsOverride } from '../types.js'

type Props = {
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the variant options collection, defaults to 'variantOptions'.
   */
  variantOptionsSlug?: string
}

export const variantTypesCollection: (props?: Props) => CollectionConfig = (props) => {
  const { overrides, variantOptionsSlug = 'variantOptions' } = props || {}
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
      on: 'variantType',
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields: variantTypesDefaultFields })
      : variantTypesDefaultFields

  const baseConfig: CollectionConfig = {
    slug: 'variantTypes',
    ...overrides,
    admin: {
      group: false,
      useAsTitle: 'label',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
