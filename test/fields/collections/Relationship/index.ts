import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const relationshipFieldsSlug = 'relationship-fields'

const RelationshipFields: CollectionConfig = {
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'relationship',
      relationTo: ['text-fields', 'array-fields'],
      required: true,
      type: 'relationship',
    },
    {
      name: 'relationToSelf',
      relationTo: relationshipFieldsSlug,
      type: 'relationship',
    },
    {
      name: 'relationToSelfSelectOnly',
      admin: {
        allowCreate: false,
      },
      relationTo: relationshipFieldsSlug,
      type: 'relationship',
    },
    {
      name: 'relationWithDynamicDefault',
      defaultValue: ({ user }) => user?.id,
      relationTo: 'users',
      type: 'relationship',
    },
    {
      name: 'relationHasManyWithDynamicDefault',
      defaultValue: ({ user }) =>
        user
          ? {
              relationTo: 'users',
              value: user.id,
            }
          : undefined,
      relationTo: ['users'],
      type: 'relationship',
    },
    {
      name: 'relationshipWithMin',
      hasMany: true,
      minRows: 2,
      relationTo: 'text-fields',
      type: 'relationship',
    },
    {
      name: 'relationshipWithMax',
      hasMany: true,
      maxRows: 2,
      relationTo: 'text-fields',
      type: 'relationship',
    },
    {
      name: 'relationshipHasMany',
      hasMany: true,
      relationTo: 'text-fields',
      type: 'relationship',
    },
    {
      name: 'array',
      fields: [
        {
          name: 'relationship',
          relationTo: 'text-fields',
          type: 'relationship',
        },
      ],
      type: 'array',
    },
  ],
  slug: relationshipFieldsSlug,
}

export default RelationshipFields
