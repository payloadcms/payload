import type { Access, CollectionConfig, Where } from 'payload'

import { tenantsSlug } from '../shared.js'

const tenantAccess: Access = ({ req }) => {
  // admins can access all tenants
  if (req?.user?.roles?.includes('admin')) {
    return true
  }

  if (req.user) {
    // Filter tenants where user has 'admin' tenantRole
    const adminTenants = (
      (req.user.tenants as Array<{ tenant: { id: string } | string; tenantRole?: string }>) || []
    )
      .filter((t) => t.tenantRole === 'admin')
      .map((t) => (typeof t.tenant === 'string' ? t.tenant : t.tenant?.id))
      .filter(Boolean)

    // User can access tenants where they have 'admin' tenantRole OR public tenants
    if (adminTenants.length > 0) {
      return {
        or: [
          {
            id: {
              in: adminTenants,
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

  // Default: only public tenants
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
