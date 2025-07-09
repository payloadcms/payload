import type {
  Access,
  AccessArgs,
  AccessResult,
  AllOperations,
  CollectionConfig,
  TypedUser,
  TypeWithID,
  Where,
} from 'payload'

import { extractID } from 'payload/shared'

import type { MultiTenantPluginConfig, UserWithTenantsField } from '../types.js'

import { combineWhereConstraints } from './combineWhereConstraints.js'
import { getTenantAccess } from './getTenantAccess.js'

type Args<ConfigType> = {
  accessFunction?: Access
  adminUsersSlug: string
  collection: CollectionConfig
  fieldName: string
  operation: AllOperations
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}
export const withTenantAccess =
  <ConfigType>({
    accessFunction,
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
      return false
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
      return combineWhereConstraints(constraints)
    }

    return accessResult
  }

export const withUserTenantAccess =
  <ConfigType>({
    accessFunction,
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
      return false
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

      const joinedTenants = args.req.user.joinedTenants?.docs.map((doc: TypeWithID) => doc.id) || []

      const tenantUserIDs = await args.req.payload.find({
        collection: 'tenants',
        depth: 0,
        limit: 0,
        req: args.req,
        select: {
          assignedUsers: true,
        },
        user: args.req.user,
        where: {
          id: {
            in: joinedTenants,
          },
        },
      })
      const userIDs = new Set<number | string>([args.req.user.id])
      tenantUserIDs.docs.forEach((doc: any) => {
        doc.assignedUsers.forEach(({ user: tenantUser }: { user: TypeWithID }) => {
          userIDs.add(extractID(tenantUser))
        })
      })

      if (collection.slug === args.req.user.collection) {
        constraints.push({
          id: {
            in: Array.from(userIDs),
          },
        })
      } else {
        constraints.push(tenantConstraint)
      }

      return combineWhereConstraints(constraints)
    }

    return accessResult
  }
