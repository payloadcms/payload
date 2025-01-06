import type { RelationshipField } from 'payload'

import type { MultiTenantPluginConfig, UserWithTenantsField } from '../../types.js'

import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'
import { defaultValue } from './defaultValue.js'

type Args = {
  access: MultiTenantPluginConfig['documentTenantField']['access']
  name: string
  tenantsCollectionSlug: MultiTenantPluginConfig['tenantsSlug']
  userHasAccessToAllTenants: MultiTenantPluginConfig['userHasAccessToAllTenants']
}
export const tenantField = ({
  name,
  access,
  tenantsCollectionSlug,
  userHasAccessToAllTenants,
}: Args): RelationshipField => ({
  name,
  type: 'relationship',
  access,
  admin: {
    components: {
      Field: {
        path: '@payloadcms/plugin-multi-tenant/rsc#TenantFieldRSC',
        serverProps: {
          userHasAccessToAllTenants,
        },
      },
    },
    position: 'sidebar',
  },
  defaultValue: defaultValue({ userHasAccessToAllTenants }),
  hasMany: false,
  hooks: {
    beforeValidate: [
      ({ req, value }) => {
        if (!value) {
          const tenantIDs = getUserTenantIDs(req.user as UserWithTenantsField)
          if (tenantIDs.length === 1) {
            return tenantIDs[0]
          }
        }

        return value
      },
    ],
  },
  index: true,
  relationTo: tenantsCollectionSlug,
  required: true,
})
