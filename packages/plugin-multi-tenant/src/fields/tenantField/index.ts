import type { RelationshipFieldSingleValidation, SingleRelationshipField } from 'payload'

import { APIError } from 'payload'

import type { RootTenantFieldConfigOverrides } from '../../types.js'

import { defaults } from '../../defaults.js'
import { getCollectionIDType } from '../../utilities/getCollectionIDType.js'
import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'

type Args = {
  debug?: boolean
  name: string
  overrides?: RootTenantFieldConfigOverrides
  tenantsCollectionSlug: string
  unique: boolean
}
export const tenantField = ({
  name = defaults.tenantFieldName,
  debug,
  overrides: _overrides = {},
  tenantsCollectionSlug = defaults.tenantCollectionSlug,
  unique,
}: Args): SingleRelationshipField => {
  const { validate, ...overrides } = _overrides || {}
  return {
    ...(overrides || {}),
    name,
    type: 'relationship',
    access: overrides?.access || {},
    admin: {
      allowCreate: false,
      allowEdit: false,
      disableListColumn: true,
      disableListFilter: true,
      ...(overrides?.admin || {}),
      components: {
        ...(overrides?.admin?.components || {}),
        Field: {
          path: '@payloadcms/plugin-multi-tenant/client#TenantField',
          ...(typeof overrides?.admin?.components?.Field !== 'string'
            ? overrides?.admin?.components?.Field || {}
            : {}),
          clientProps: {
            ...(typeof overrides?.admin?.components?.Field !== 'string'
              ? (overrides?.admin?.components?.Field || {})?.clientProps
              : {}),
            debug,
            unique,
          },
        },
      },
    },
    hasMany: false,
    hooks: {
      ...(overrides.hooks || []),
      beforeChange: [
        ({ req, value }) => {
          const idType = getCollectionIDType({
            collectionSlug: tenantsCollectionSlug,
            payload: req.payload,
          })
          if (!value) {
            const tenantFromCookie = getTenantFromCookie(req.headers, idType)
            if (tenantFromCookie) {
              return tenantFromCookie
            }
            throw new APIError('You must select a tenant', 400, null, true)
          }

          return idType === 'number' ? parseFloat(value) : value
        },
        ...(overrides?.hooks?.beforeChange || []),
      ],
    },
    index: true,
    validate: (validate as RelationshipFieldSingleValidation) || undefined,
    // @ts-expect-error translations are not typed for this plugin
    label: overrides?.label || (({ t }) => t('plugin-multi-tenant:field-assignedTenant-label')),
    relationTo: tenantsCollectionSlug,
    unique,
  }
}
