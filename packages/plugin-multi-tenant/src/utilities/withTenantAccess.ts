import type { Access, AccessArgs, AccessResult } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { combineWhereConstraints } from './combineWhereConstraints.js'
import { getTenantAccess } from './getTenantAccess.js'

type Args = {
  accessFunction?: Access
  userHasAccessToAllTenants: MultiTenantPluginConfig['userHasAccessToAllTenants']
}
export const withTenantAccess =
  ({ accessFunction, userHasAccessToAllTenants }: Args) =>
  async (args: AccessArgs): Promise<AccessResult> => {
    let accessResult: AccessResult
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
      const tenantConstraint = getTenantAccess({
        user: args.req.user,
      })

      if (tenantConstraint) {
        constraints.push(tenantConstraint)
        return combineWhereConstraints(constraints)
      }
    }

    return accessResult
  }
