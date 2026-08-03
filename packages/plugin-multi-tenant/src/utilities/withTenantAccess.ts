import type { Access, AccessArgs, AccessResult, CollectionConfig, User, Where } from 'payload'

import type { AllAccessKeys, MultiTenantPluginConfig, UserWithTenantsField } from '../types.js'

import { combineWhereConstraints } from './combineWhereConstraints.js'
import { getTenantAccess } from './getTenantAccess.js'

type Args = {
  accessFunction?: Access
  accessKey: AllAccessKeys[number]
  accessResultCallback?: MultiTenantPluginConfig['usersAccessResultOverride']
  adminUsersSlug: string
  collection: CollectionConfig
  fieldName: string
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig>['userHasAccessToAllTenants']
}
export const withTenantAccess =
  ({
    accessFunction,
    accessKey,
    accessResultCallback,
    adminUsersSlug,
    collection,
    fieldName,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    userHasAccessToAllTenants,
  }: Args) =>
  async (args: AccessArgs): Promise<AccessResult> => {
    const constraints: Where[] = []
    const accessFn =
      typeof accessFunction === 'function'
        ? accessFunction
        : ({ req }: AccessArgs): AccessResult => Boolean(req.user)
    const accessResult: AccessResult = await accessFn(args)

    if (accessResult === false) {
      if (accessResultCallback) {
        return accessResultCallback({
          accessKey,
          accessResult: false,
          ...args,
        })
      } else {
        return false
      }
    } else if (accessResult && typeof accessResult === 'object') {
      constraints.push(accessResult)
    }

    if (
      args.req.user &&
      args.req.user.collection === adminUsersSlug &&
      !userHasAccessToAllTenants(args.req.user as User)
    ) {
      const tenantConstraint = getTenantAccess({
        fieldName,
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        user: args.req.user as UserWithTenantsField,
      })

      // User with no tenants should have no access to tenant-scoped documents
      // except for their own user document
      if (tenantConstraint[fieldName]?.in.length === 0) {
        const result: AccessResult =
          collection.slug === args.req.user.collection
            ? { id: { equals: args.req.user.id } }
            : false

        return accessResultCallback
          ? accessResultCallback({ accessKey, accessResult: result, ...args })
          : result
      }

      if (collection.slug === args.req.user.collection) {
        constraints.push({
          or: [
            {
              id: {
                equals: args.req.user.id,
              },
            },
            tenantConstraint,
          ],
        })
      } else {
        constraints.push(tenantConstraint)
      }

      if (accessResultCallback) {
        return accessResultCallback({
          accessKey,
          accessResult: combineWhereConstraints(constraints),
          ...args,
        })
      } else {
        return combineWhereConstraints(constraints)
      }
    }

    if (accessResultCallback) {
      return accessResultCallback({
        accessKey,
        accessResult,
        ...args,
      })
    } else {
      return accessResult
    }
  }
