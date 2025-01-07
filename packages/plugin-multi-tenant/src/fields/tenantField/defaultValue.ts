import type { DefaultValue } from 'payload'

import type { MultiTenantPluginConfig, UserWithTenantsField } from '../../types.js'

import { getTenantFromCookie } from '../../utilities/getTenantFromCookie.js'
import { getUserTenantIDs } from '../../utilities/getUserTenantIDs.js'

type Args = {
  userHasAccessToAllTenants: MultiTenantPluginConfig['userHasAccessToAllTenants']
}
export const defaultValue =
  ({ userHasAccessToAllTenants }: Args): DefaultValue =>
  ({ req }) => {
    const selectedTenant = getTenantFromCookie(req.headers)
    const userTenantIDs = getUserTenantIDs(req.user as UserWithTenantsField)
    if (
      selectedTenant &&
      (userTenantIDs.includes(selectedTenant) ||
        userHasAccessToAllTenants(req.user as UserWithTenantsField))
    ) {
      return selectedTenant
    }

    return null
  }
