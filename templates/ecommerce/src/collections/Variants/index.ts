import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { Field } from 'payload'

export const VariantsCollection: CollectionOverride = {
  fields: ({ defaultFields }) => {
    const fields: Field[] = [
      ...defaultFields,
      {
        name: 'gallery',
        type: 'upload',
        relationTo: 'media',
        hasMany: true,
      },
    ]

    return fields
  },
}
