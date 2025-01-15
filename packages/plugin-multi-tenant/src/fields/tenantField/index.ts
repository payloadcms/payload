import { type RelationshipField } from 'payload'
import { APIError } from 'payload'

import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'

type Args = {
  access?: RelationshipField['access']
  debug?: boolean
  name: string
  tenantsCollectionSlug: string
  unique: boolean
}
export const tenantField = ({
  name,
  access = undefined,
  debug,
  tenantsCollectionSlug,
  unique,
}: Args): RelationshipField => ({
  name,
  type: 'relationship',
  access,
  admin: {
    allowCreate: false,
    allowEdit: false,
    components: {
      Field: {
        clientProps: {
          debug,
          unique,
        },
        path: '@payloadcms/plugin-multi-tenant/client#TenantField',
      },
    },
    disableListColumn: true,
    disableListFilter: true,
  },
  hasMany: false,
  hooks: {
    beforeChange: [
      ({ req, value }) => {
        if (!value) {
          const tenantFromCookie = getTenantFromCookie(req.headers, req.payload.db.defaultIDType)
          if (tenantFromCookie) {
            return tenantFromCookie
          }
          throw new APIError('You must select a tenant', 400, null, true)
        }
      },
    ],
  },
  index: true,
  label: 'Assigned Tenant',
  relationTo: tenantsCollectionSlug,
  unique,
})
