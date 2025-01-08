import { type RelationshipField } from 'payload'
import { APIError } from 'payload'

import type { MultiTenantPluginConfig } from '../../types.js'

import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'

type Args = {
  access: MultiTenantPluginConfig['documentTenantField']['access']
  debug?: boolean
  name: string
  tenantsCollectionSlug: MultiTenantPluginConfig['tenantsSlug']
}
export const tenantField = ({
  name,
  access,
  debug,
  tenantsCollectionSlug,
}: Args): RelationshipField => ({
  name,
  type: 'relationship',
  access,
  admin: {
    components: {
      Field: {
        clientProps: {
          debug,
          tenantsCollectionSlug,
        },
        path: '@payloadcms/plugin-multi-tenant/rsc#TenantField',
      },
    },
    position: debug ? 'sidebar' : undefined,
  },
  hasMany: false,
  hooks: {
    beforeChange: [
      ({ req, value }) => {
        if (!value) {
          const tenantFromCookie = getTenantFromCookie(req.headers)
          if (tenantFromCookie) {
            return tenantFromCookie
          }
          throw new APIError('You must select a tenant', 400, null, true)
        }
      },
    ],
  },
  index: true,
  relationTo: tenantsCollectionSlug,
})
