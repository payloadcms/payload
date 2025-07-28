import { admins } from '@/access/admins'
import { ownerOrAdminOrder } from './access'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { Field, PolymorphicRelationshipField } from 'payload'

export const OrdersCollection: CollectionOverride = {
  admin: {
    group: 'Ecommerce',
  },
  access: {
    create: admins,
    delete: ownerOrAdminOrder(),
    read: ownerOrAdminOrder(),
    update: ownerOrAdminOrder(),
  },
  fields: ({ defaultFields }) => {
    const fields: Field[] = defaultFields.map((field) => {
      if ('name' in field && field.name === 'transactions') {
        const updatedField: PolymorphicRelationshipField = {
          ...(field as PolymorphicRelationshipField),
          access: {
            create: admins,
            read: admins,
            update: admins,
          },
        }

        return updatedField
      }

      return field
    })

    return fields
  },
}
