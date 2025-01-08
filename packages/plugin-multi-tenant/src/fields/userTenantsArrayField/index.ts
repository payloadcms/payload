import type { ArrayField } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

export const userTenantsField = (
  args: MultiTenantPluginConfig['userTenantsField'],
): ArrayField => ({
  name: 'tenants',
  type: 'array',
  access: args?.access,
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      access: args.access,
      index: true,
      relationTo: 'tenants',
      required: true,
      saveToJWT: true,
    },
    ...(args?.rowFields || []),
  ],
  saveToJWT: true,
})
