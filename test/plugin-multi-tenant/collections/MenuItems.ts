import type { Access, CollectionConfig, Where } from 'payload'

import { getUserTenantIDs } from '@payloadcms/plugin-multi-tenant/utilities'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { menuItemsSlug, notTenantedSlug, relationshipsSlug } from '../shared.js'

const collectionTenantReadAccess: Access = ({ req }) => {
  // admins can access all tenants
  if (req?.user?.roles?.includes('admin')) {
    return true
  }

  if (req.user) {
    const assignedTenants = getUserTenantIDs(req.user, {
      tenantsArrayFieldName: 'tenants',
      tenantsArrayTenantFieldName: 'tenant',
    })

    // if the user has assigned tenants, add id constraint
    if (assignedTenants.length > 0) {
      return {
        or: [
          {
            tenant: {
              in: assignedTenants,
            },
          },
          {
            'tenant.isPublic': {
              equals: true,
            },
          },
        ],
      }
    }
  }

  // if the user has no assigned tenants, return a filter that allows access to public tenants
  return {
    'tenant.isPublic': {
      equals: true,
    },
  } as Where
}

const collectionTenantUpdateAndDeleteAccess: Access = ({ req }) => {
  // admins can update all tenants
  if (req?.user?.roles?.includes('admin')) {
    return true
  }

  if (req.user) {
    const assignedTenants = getUserTenantIDs(req.user, {
      tenantsArrayFieldName: 'tenants',
      tenantsArrayTenantFieldName: 'tenant',
    })

    // if the user has assigned tenants, add id constraint
    if (assignedTenants.length > 0) {
      return {
        tenant: {
          in: assignedTenants,
        },
      }
    }
  }

  return false
}

export const MenuItems: CollectionConfig = {
  slug: menuItemsSlug,
  access: {
    read: collectionTenantReadAccess,
    create: ({ req }) => {
      return Boolean(req?.user?.roles?.includes('admin') || req.user?.tenants?.length)
    },
    update: collectionTenantUpdateAndDeleteAccess,
    delete: collectionTenantUpdateAndDeleteAccess,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Tenant Collections',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'localizedName',
      type: 'text',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'block-with-relationship',
                fields: [
                  {
                    name: 'relationship',
                    type: 'relationship',
                    relationTo: 'food-menu',
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    {
      name: 'polymorphicRelationship',
      type: 'relationship',
      relationTo: [relationshipsSlug, menuItemsSlug, notTenantedSlug],
      admin: {
        appearance: 'drawer',
      },
    },
  ],
}
