import type { Access, CollectionConfig, Where } from 'payload'

import { getUserTenantIDs } from '@payloadcms/plugin-multi-tenant/utilities'

import { tenantsSlug } from '../shared.js'

const tenantAccess: Access = ({ req }) => {
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
            id: {
              in: assignedTenants,
            },
          },
          {
            isPublic: {
              equals: true,
            },
          },
        ],
      }
    }
  }

  // if the user has no assigned tenants, return a filter that allows access to public tenants
  return {
    isPublic: {
      equals: true,
    },
  } as Where
}

export const Tenants: CollectionConfig = {
  slug: tenantsSlug,
  access: {
    read: tenantAccess,
    create: tenantAccess,
    update: tenantAccess,
    delete: tenantAccess,
  },
  labels: {
    singular: 'Tenant',
    plural: 'Tenants',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Administrative',
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
    },
    {
      type: 'join',
      name: 'users',
      collection: 'users',
      on: 'tenants.tenant',
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      label: 'Public Tenant',
    },
    {
      name: 'selectedLocales',
      type: 'select',
      hasMany: true,
      defaultValue: ['allLocales'],
      options: [
        {
          label: 'All Locales',
          value: 'allLocales',
        },
        {
          label: 'English',
          value: 'en',
        },
        {
          label: 'Spanish',
          value: 'es',
        },
        {
          label: 'French',
          value: 'fr',
        },
      ],
    },
  ],
}
