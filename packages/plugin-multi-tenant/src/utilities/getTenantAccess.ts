import type { Where } from 'payload'

import type { UserWithTenantsField } from '../types.js'

import { defaults } from '../defaults.js'
import { getUserTenantIDs } from './getUserTenantIDs.js'

type Args = {
  fieldName: string
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  user: UserWithTenantsField
}
export function getTenantAccess({
  fieldName,
  tenantsArrayFieldName = defaults.tenantsArrayFieldName,
  tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName,
  user,
}: Args): Where {
  const userAssignedTenantIDs = getUserTenantIDs(user, {
    tenantsArrayFieldName,
    tenantsArrayTenantFieldName,
  })

  return {
    [fieldName]: {
      in: userAssignedTenantIDs || [],
    },
  }
}
