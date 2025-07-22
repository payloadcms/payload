import { admins } from '@/access/admins'
import { anyone } from '@/access/anyone'
import { slugField } from '@/fields/slug'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { Field } from 'payload'

export const VariantTypesCollection: CollectionOverride = {
  access: {
    create: admins,
    update: admins,
    delete: admins,
    read: anyone,
  },
}
