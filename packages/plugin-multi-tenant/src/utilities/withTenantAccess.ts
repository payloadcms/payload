import type { Access, AccessArgs, AccessResult, CollectionConfig, TypedUser, Where } from '@ruya.sa/payload'

import type { AllAccessKeys, MultiTenantPluginConfig, UserWithTenantsField } from '../types.js'

import { combineWhereConstraints } from './combineWhereConstraints.js'
import { getTenantAccess } from './getTenantAccess.js'

type Args<ConfigType> = {
  accessFunction?: Access
  accessKey: AllAccessKeys[number]
  accessResultCallback?: MultiTenantPluginConfig<ConfigType>['usersAccessResultOverride']
  adminUsersSlug: string
  collection: CollectionConfig
  fieldName: string
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}
export const withTenantAccess =
  <ConfigType>({
    accessFunction,
    accessKey,
    accessResultCallback,
    adminUsersSlug,
    collection,
    fieldName,
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
    userHasAccessToAllTenants,
  }: Args<ConfigType>) =>
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
      !userHasAccessToAllTenants(
        args.req.user as ConfigType extends { user: unknown } ? ConfigType['user'] : TypedUser,
      )
    ) {
      const tenantConstraint = getTenantAccess({
        fieldName,
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        user: args.req.user as UserWithTenantsField,
      })
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
