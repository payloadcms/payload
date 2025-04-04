import type { CollectionConfig, Field } from 'payload'

import type { FieldsOverride } from '../types.js'

type Props = {
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const variantOptionsDefaultFields: Field[] = [
  {
    name: 'variantType',
    type: 'relationship',
    admin: {
      readOnly: true,
    },
    relationTo: 'variantTypes',
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
  // {
  //   name: 'images',
  //   type: 'upload',
  //   hasMany: true,
  //   relationTo: 'media',
  // },
]

export const variantOptionsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields: variantOptionsDefaultFields })
      : variantOptionsDefaultFields

  const baseConfig: CollectionConfig = {
    slug: 'variantOptions',
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
