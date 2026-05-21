import type { RelationshipFieldValidation, SingleRelationshipField } from 'payload'

import type { RootTenantFieldConfigOverrides } from '../../types.js'

import { defaults } from '../../defaults.js'
import { getCollectionIDType } from '../../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'

const tenantFieldValidate: RelationshipFieldValidation = (value, options) => {
  const isEmpty = options.hasMany ? !value || (Array.isArray(value) && value.length === 0) : !value
  return isEmpty ? options.req.t('validation:required') : true
}

type Args = {
  debug?: boolean
  isAutosaveEnabled?: boolean
  name: string
  overrides?: RootTenantFieldConfigOverrides
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  unique: boolean
}
export const tenantField = ({
  name = defaults.tenantFieldName,
  debug,
  isAutosaveEnabled,
  overrides: _overrides = {},
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  tenantsCollectionSlug = defaults.tenantCollectionSlug,
  unique,
}: Args): SingleRelationshipField => {
  const { hasMany = false, validate: validateOverride, ...overrides } = _overrides || {}
  return {
    ...(overrides || {}),
    name,
    type: 'relationship',
    access: overrides.access || {},
    admin: {
      allowCreate: false,
      allowEdit: false,
      disabled: { column: true, filter: true, groupBy: true },
      position: 'sidebar',
      ...(overrides.admin || {}),
      components: {
        ...(overrides.admin?.components || {}),
        Field: {
          path: '@payloadcms/plugin-multi-tenant/client#TenantField',
          ...(typeof overrides.admin?.components?.Field !== 'string'
            ? overrides.admin?.components?.Field || {}
            : {}),
          clientProps: {
            ...(typeof overrides.admin?.components?.Field !== 'string'
              ? (overrides.admin?.components?.Field || {})?.clientProps
              : {}),
            debug,
            unique,
          },
        },
      },
    },
    defaultValue:
      overrides.defaultValue ||
      (async ({ req }) => {
        const idType = getCollectionIDType({
          collectionSlug: tenantsCollectionSlug,
          payload: req.payload,
        })
        const tenantFromCookie = getTenantFromCookie(req.headers, idType)
        if (tenantFromCookie) {
          const isValidTenant = await req.payload.count({
            collection: tenantsCollectionSlug,
            overrideAccess: false,
            req,
            user: req.user,
            where: {
              id: {
                in: [tenantFromCookie],
              },
            },
          })
          return isValidTenant ? tenantFromCookie : null
        }
        if (req.user && isAutosaveEnabled) {
          const userTenants = getUserTenantIDs(req.user, {
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
          })
          if (userTenants.length > 0) {
            return userTenants[0]
          }
        }
        return null
      }),
    filterOptions:
      overrides.filterOptions ||
      (({ req }) => {
        const userAssignedTenants = getUserTenantIDs(req.user, {
          tenantsArrayFieldName,
          tenantsArrayTenantFieldName,
        })
        if (userAssignedTenants.length > 0) {
          return {
            id: {
              in: userAssignedTenants,
            },
          }
        }

        return true
      }),
    index: true,
    relationTo: tenantsCollectionSlug,
    unique,
    validate: validateOverride || tenantFieldValidate,
    ...(hasMany
      ? {
          hasMany: true,
          required: true,
        }
      : {
          hasMany: false,
          required: true,
        }),
    // @ts-expect-error translations are not typed for this plugin
    label: overrides.label || (({ t }) => t('plugin-multi-tenant:field-assignedTenant-label')),
  }
}
