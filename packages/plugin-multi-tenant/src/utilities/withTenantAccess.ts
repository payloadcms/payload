import type { Access, AccessArgs, AccessResult } from 'payload'

import type { MultiTenantPluginConfig, UserWithTenantsField } from '../types.js'

import { combineWhereConstraints } from './combineWhereConstraints.js'
import { getTenantAccess } from './getTenantAccess.js'

type Args = {
  accessFunction?: Access
  fieldName: string
  userHasAccessToAllTenants: MultiTenantPluginConfig['userHasAccessToAllTenants']
}
export const withTenantAccess =
  ({ accessFunction, fieldName, userHasAccessToAllTenants }: Args) =>
  async (args: AccessArgs): Promise<AccessResult> => {
    let accessResult: AccessResult = true
    const constraints = []

    if (typeof accessFunction === 'function') {
      accessResult = await accessFunction(args)
      if (accessResult === false) {
        return false
      } else if (accessResult && typeof accessResult === 'object') {
        constraints.push(accessResult)
      }
    }
    if (!userHasAccessToAllTenants(args.req.user)) {
      constraints.push(
        getTenantAccess({
          fieldName,
          user: args.req.user as UserWithTenantsField,
        }),
      )
      return combineWhereConstraints(constraints)
    }

    return accessResult
  }
