import type { ArrayField, RelationshipField } from 'payload'

export const tenantsArrayField = (args: {
  arrayFieldAccess?: ArrayField['access']
  rowFields?: ArrayField['fields']
  tenantFieldAccess?: RelationshipField['access']
  tenantsArrayFieldName: ArrayField['name']
  tenantsArrayTenantFieldName: RelationshipField['name']
  tenantsCollectionSlug: string
}): ArrayField => ({
  name: args.tenantsArrayFieldName,
  type: 'array',
  access: args?.arrayFieldAccess,
  fields: [
    {
      name: args.tenantsArrayTenantFieldName,
      type: 'relationship',
      access: args.tenantFieldAccess,
      index: true,
      relationTo: args.tenantsCollectionSlug,
      required: true,
      saveToJWT: true,
    },
    ...(args?.rowFields || []),
  ],
  saveToJWT: true,
})
