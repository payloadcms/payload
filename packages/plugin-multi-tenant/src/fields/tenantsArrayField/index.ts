import type { ArrayField, RelationshipField } from 'payload'

import { defaults } from '../../defaults.js'

type Args = {
  /**
   * Access configuration for the array field
   */
  arrayFieldAccess?: ArrayField['access']
  /**
   * Additional fields to include on the tenant array rows
   */
  rowFields?: ArrayField['fields']
  /**
   * Access configuration for the tenant field
   */
  tenantFieldAccess?: RelationshipField['access']
  /**
   * The name of the array field that holds the tenants
   *
   * @default 'tenants'
   */
  tenantsArrayFieldName?: ArrayField['name']
  /**
   * The name of the field that will be used to store the tenant relationship in the array
   *
   * @default 'tenant'
   */
  tenantsArrayTenantFieldName?: RelationshipField['name']
  /**
   * The slug for the tenant collection
   *
   * @default 'tenants'
   */
  tenantsCollectionSlug?: string
}
export const tenantsArrayField = ({
  arrayFieldAccess,
  rowFields,
  tenantFieldAccess,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
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
