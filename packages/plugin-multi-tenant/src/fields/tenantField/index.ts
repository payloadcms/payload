import type { RelationshipFieldValidation, SingleRelationshipField } from 'payload'

import type { RootTenantFieldConfigOverrides } from '../../types.js'

import { defaults } from '../../defaults.js'
import { getCollectionIDType } from '../../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'

const fieldValidation =
  (validateFunction?: RelationshipFieldValidation): RelationshipFieldValidation =>
  (value, options) => {
    if (validateFunction) {
      const result = validateFunction(value, options)
      if (result !== true) {
        return result
      }
    }

    if (options.hasMany) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return options.req.t('validation:required')
      }
    } else {
      if (!value) {
        return options.req.t('validation:required')
      }
    }

    return true
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
  const { hasMany = false, validate, ...overrides } = _overrides || {}
  return {
    ...(overrides || {}),
    name,
    type: 'relationship',
    access: overrides.access || {},
    admin: {
      allowCreate: false,
      allowEdit: false,
      disableGroupBy: true,
      disableListColumn: true,
      disableListFilter: true,
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
    ...(hasMany
      ? {
          hasMany: true,
          // TODO: V4 - replace validation with required: true
          validate: fieldValidation(validate as RelationshipFieldValidation),
        }
      : {
          hasMany: false,
          // TODO: V4 - replace validation with required: true
          validate: fieldValidation(validate as RelationshipFieldValidation),
        }),
    // @ts-expect-error translations are not typed for this plugin
    label: overrides.label || (({ t }) => t('plugin-multi-tenant:field-assignedTenant-label')),
  }
}
