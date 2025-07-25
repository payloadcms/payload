import { admins } from '@/access/admins'
import { adminsOrPublished } from '@/access/adminsOrPublished'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { Field } from 'payload'

export const VariantsCollection: CollectionOverride = {
  admin: {
    group: 'Ecommerce',
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  access: {
    create: admins,
    update: admins,
    delete: admins,
    read: adminsOrPublished,
  },
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
