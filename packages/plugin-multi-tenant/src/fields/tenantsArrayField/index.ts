import type { ArrayField, RelationshipField } from 'payload'

export const tenantsArrayField = (args: {
  arrayFieldAccess?: ArrayField['access']
  rowFields?: ArrayField['fields']
  tenantFieldAccess?: RelationshipField['access']
}): ArrayField => ({
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
