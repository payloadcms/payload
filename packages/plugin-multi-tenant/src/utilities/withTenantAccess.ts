import type { Access, AccessArgs, AccessResult } from 'payload'

import type { MultiTenantPluginConfig, UserWithTenantsField } from '../types.js'

import { combineWhereConstraints } from './combineWhereConstraints.js'
import { getTenantAccess } from './getTenantAccess.js'

type Args = {
  accessFunction?: Access
  fieldName: string
  userHasAccessToAllTenants: MultiTenantPluginConfig[Required<'userHasAccessToAllTenants'>]
}
export const withTenantAccess =
  ({ accessFunction, fieldName, userHasAccessToAllTenants }: Args) =>
  async (args: AccessArgs): Promise<AccessResult> => {
    const constraints = []
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

    if (args.req.user && !userHasAccessToAllTenants(args.req.user)) {
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
