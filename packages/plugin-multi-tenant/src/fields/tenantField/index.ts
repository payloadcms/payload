import { type RelationshipField } from 'payload'
import { APIError } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

type Args = {
  access: MultiTenantPluginConfig['documentTenantField']['access']
  name: string
  tenantsCollectionSlug: MultiTenantPluginConfig['tenantsSlug']
}
export const tenantField = ({ name, access, tenantsCollectionSlug }: Args): RelationshipField => ({
  name,
  type: 'relationship',
  access,
  admin: {
    components: {
      Field: {
        path: '@payloadcms/plugin-multi-tenant/rsc#TenantField',
      },
    },
  },
  hasMany: false,
  hooks: {
    beforeChange: [
      ({ value }) => {
        if (!value) {
          throw new APIError('You must select a tenant', 400, null, true)
        }
      },
    ],
  },
  index: true,
  relationTo: tenantsCollectionSlug,
})
