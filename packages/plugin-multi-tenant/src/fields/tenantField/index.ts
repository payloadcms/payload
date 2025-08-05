import { type RelationshipField } from 'payload'
import { APIError } from 'payload'

import { defaults } from '../../defaults.js'
import { filterDocumentsByTenants } from '../../filters/filterDocumentsByTenants.js'
import { getCollectionIDType } from '../../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'

type Args = {
  access?: RelationshipField['access']
  debug?: boolean
  name: string
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  unique: boolean
}
export const tenantField = ({
  name = defaults.tenantFieldName,
  access = undefined,
  debug,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  tenantsCollectionSlug = defaults.tenantCollectionSlug,
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
    position: 'sidebar',
  },
  defaultValue: async ({ req }) => {
    const idType = getCollectionIDType({
      collectionSlug: tenantsCollectionSlug,
      payload: req.payload,
    })
    const tenantFromCookie = getTenantFromCookie(req.headers, idType)
    if (tenantFromCookie) {
      const isValidTenant = await req.payload.count({
        collection: tenantsCollectionSlug,
        depth: 0,
        overrideAccess: false,
        req,
        user: req.user,
        where: {
          id: {
            equals: tenantFromCookie,
          },
        },
      })
      return isValidTenant ? tenantFromCookie : null
    }
    return null
  },
  filterOptions: ({ req }) => {
    const tenantFilterResult = filterDocumentsByTenants({
      filterFieldName: 'id',
      req,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      tenantsCollectionSlug,
    })

    if (tenantFilterResult === null) {
      return true
    }

    return tenantFilterResult
  },
  hasMany: false,
  index: true,
  required: true,
  // @ts-expect-error translations are not typed for this plugin
  label: ({ t }) => t('plugin-multi-tenant:field-assignedTentant-label'),
  relationTo: tenantsCollectionSlug,
  unique,
})
