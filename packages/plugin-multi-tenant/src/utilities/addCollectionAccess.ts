import type { AccessArgs, AccessResult, CollectionConfig, Config, User, Where } from 'payload'

import type { AllAccessKeys, MultiTenantPluginConfig } from '../types.js'

import { getTenantAccess } from './getTenantAccess.js'

export const collectionAccessKeys: AllAccessKeys = [
  'create',
  'read',
  'update',
  'delete',
  'readVersions',
  'unlock',
  'validate',
] as const

export type TenantAccessConfig = {
  accessResultCallback?: MultiTenantPluginConfig['usersAccessResultOverride']
  adminUsersSlug: string
  collection: CollectionConfig
  fieldName: string
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig>['userHasAccessToAllTenants']
}

const getTenantAccessResult = ({
  accessKey,
  accessResult,
  accessResultCallback,
  adminUsersSlug,
  args,
  collection,
  fieldName,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  userHasAccessToAllTenants,
}: {
  accessKey: AllAccessKeys[number]
  accessResult: AccessResult
  args: AccessArgs
} & TenantAccessConfig): AccessResult | Promise<AccessResult> => {
  const finish = (result: AccessResult): AccessResult | Promise<AccessResult> =>
    accessResultCallback
      ? accessResultCallback({ accessKey, accessResult: result, ...args })
      : result

  if (!accessResult) {
    return finish(false)
  }

  const user = args.req.user

  if (!user || user.collection !== adminUsersSlug || userHasAccessToAllTenants(user as User)) {
    return finish(accessResult)
  }

  const tenantConstraint = getTenantAccess({
    fieldName,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    user,
  })

  if (tenantConstraint[fieldName]?.in.length === 0) {
    return finish(collection.slug === user.collection ? { id: { equals: user.id } } : false)
  }

  const tenantResult: Where =
    collection.slug === user.collection
      ? { or: [{ id: { equals: user.id } }, tenantConstraint] }
      : tenantConstraint

  return finish(accessResult === true ? tenantResult : { and: [accessResult, tenantResult] })
}

const wrapCollectionAccess = (scope: TenantAccessConfig): void => {
  scope.collection.access ??= {}

  for (const accessKey of collectionAccessKeys) {
    const accessFunction =
      scope.collection.access[accessKey] ?? (({ req }: AccessArgs) => Boolean(req.user))

    scope.collection.access[accessKey] = async (args) =>
      getTenantAccessResult({
        ...scope,
        accessKey,
        accessResult: await accessFunction(args),
        args,
        fieldName: accessKey === 'readVersions' ? `version.${scope.fieldName}` : scope.fieldName,
      })
  }
}

export const addCollectionAccess = ({
  config,
  scopes,
}: {
  config: Config
  scopes: TenantAccessConfig[]
}): void => {
  const baseAccessScopes = new Map<string, TenantAccessConfig>()

  for (const scope of scopes) {
    if (scope.accessResultCallback) {
      wrapCollectionAccess(scope)
    } else {
      baseAccessScopes.set(scope.collection.slug, scope)
    }
  }

  if (!baseAccessScopes.size) {
    return
  }

  config.baseAccess ??= {}
  config.baseAccess.collections ??= {}

  for (const accessKey of collectionAccessKeys) {
    const baseAccessFunction = config.baseAccess.collections[accessKey]

    config.baseAccess.collections[accessKey] = async (args) => {
      const baseResult = baseAccessFunction ? await baseAccessFunction(args) : true
      const scope = baseAccessScopes.get(args.slug)

      if (!baseResult || !scope) {
        return baseResult
      }

      if (accessKey === 'create' && typeof baseResult === 'object') {
        return baseResult
      }

      const tenantResult = await getTenantAccessResult({
        ...scope,
        accessKey,
        accessResult: baseResult,
        args,
        fieldName: accessKey === 'readVersions' ? `version.${scope.fieldName}` : scope.fieldName,
      })

      return accessKey === 'create' ? Boolean(tenantResult) : tenantResult
    }
  }
}
