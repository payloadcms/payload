import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { relationshipFieldsSlug } from '../../slugs'

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
      admin: {
        sortOptions: {
          'text-fields': '-id',
          'array-fields': '-id',
        },
      },
    },
    {
      name: 'relationHasManyPolymorphic',
      type: 'relationship',
      relationTo: ['text-fields', 'array-fields'],
      hasMany: true,
      admin: {
        sortOptions: {
          'text-fields': '-text',
        },
      },
    },
    {
      name: 'relationNoHasManyNonPolymorphic',
      relationTo: 'text-fields',
      type: 'relationship',
      hasMany: false,
    },
    {
      name: 'relationHasManyNonPolymorphic',
      relationTo: 'text-fields',
      type: 'relationship',
      hasMany: true,
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
    {
      name: 'relationshipWithMinRows',
      relationTo: ['text-fields'],
      hasMany: true,
      minRows: 2,
      type: 'relationship',
    },
  ],
  slug: relationshipFieldsSlug,
}

export default RelationshipFields
