import type { ArrayField, RelationshipField } from 'payload'

import { defaults } from '../../defaults.js'

type Args = {
  arrayFieldAccess?: ArrayField['access']
  rowFields?: ArrayField['fields']
  tenantFieldAccess?: RelationshipField['access']
  tenantsArrayFieldName: ArrayField['name']
  tenantsArrayTenantFieldName: RelationshipField['name']
  tenantsCollectionSlug: string
}
export const tenantsArrayField = ({
  arrayFieldAccess,
  rowFields,
  tenantFieldAccess,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayFieldName,
  tenantsCollectionSlug = defaults.tenantCollectionSlug,
}: Args): ArrayField => ({
  name: tenantsArrayFieldName,
  type: 'array',
  access: arrayFieldAccess,
  fields: [
    {
      name: tenantsArrayTenantFieldName,
      type: 'relationship',
      access: tenantFieldAccess,
      index: true,
      relationTo: tenantsCollectionSlug,
      required: true,
      saveToJWT: true,
    },
    ...(rowFields || []),
  ],
  saveToJWT: true,
})
