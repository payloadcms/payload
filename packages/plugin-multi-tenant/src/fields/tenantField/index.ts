import type { RelationshipFieldValidation, SingleRelationshipField } from 'payload'

import type { MultiTenantPluginConfig, RootTenantFieldConfigOverrides } from '../../types.js'

import { defaults } from '../../defaults.js'
import { getCollectionIDType } from '../../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'
import { isValidTenantAssignment } from '../../utilities/isValidTenantAssignment.js'

const fieldValidation =
  ({
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    userHasAccessToAllTenants,
    validateFunction,
  }: {
    tenantsArrayFieldName: string
    tenantsArrayTenantFieldName: string
    userHasAccessToAllTenants?: MultiTenantPluginConfig['userHasAccessToAllTenants']
    validateFunction?: RelationshipFieldValidation
  }): RelationshipFieldValidation =>
  async (value, options) => {
    if (validateFunction) {
      const result = await validateFunction(value, options)
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

    if (
      isValidTenantAssignment({
        previousValue: options.previousValue,
        req: options.req,
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        userHasAccessToAllTenants,
        value,
      })
    ) {
      return true
    }

    return options.req.t('validation:invalidSelection')
  }

type Args = {
  adminUsersSlug?: string
  debug?: boolean
  isAutosaveEnabled?: boolean
  name: string
  overrides?: RootTenantFieldConfigOverrides
  tenantsArrayFieldName: string
  tenantsArrayTenantFieldName: string
  tenantsCollectionSlug: string
  unique: boolean
  userHasAccessToAllTenants?: MultiTenantPluginConfig['userHasAccessToAllTenants']
}
export const tenantField = ({
  name = defaults.tenantFieldName,
  adminUsersSlug,
  debug,
  isAutosaveEnabled,
  overrides: _overrides = {},
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  tenantsCollectionSlug = defaults.tenantCollectionSlug,
  unique,
  userHasAccessToAllTenants,
}: Args): SingleRelationshipField => {
  const { hasMany = false, validate, ...overrides } = _overrides || {}
  return {
    ...(overrides || {}),
    name,
    type: 'relationship',
    access: {
      ...(adminUsersSlug
        ? {
            create: ({ req }) => Boolean(req.user && req.user.collection === adminUsersSlug),
            update: ({ req }) => Boolean(req.user && req.user.collection === adminUsersSlug),
          }
        : {}),
      ...(overrides.access || {}),
    },
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
          const { totalDocs } = await req.payload.count({
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
          return totalDocs > 0 ? tenantFromCookie : null
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
          validate: fieldValidation({
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            userHasAccessToAllTenants,
            validateFunction: validate as RelationshipFieldValidation,
          }),
        }
      : {
          hasMany: false,
          // TODO: V4 - replace validation with required: true
          validate: fieldValidation({
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            userHasAccessToAllTenants,
            validateFunction: validate as RelationshipFieldValidation,
          }),
        }),
    // @ts-expect-error translations are not typed for this plugin
    label: overrides.label || (({ t }) => t('plugin-multi-tenant:field-assignedTenant-label')),
  }
}
