import type { ArrayField } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

export const tenantsArrayField = (
  args: Pick<
    MultiTenantPluginConfig['tenantsArrayField'],
    'arrayFieldAccess' | 'rowFields' | 'tenantFieldAccess'
  >,
): ArrayField => ({
  name: 'tenants',
  type: 'array',
  access: args?.arrayFieldAccess,
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      access: args.tenantFieldAccess,
      index: true,
      relationTo: 'tenants',
      required: true,
      saveToJWT: true,
    },
    ...(args?.rowFields || []),
  ],
  saveToJWT: true,
})
