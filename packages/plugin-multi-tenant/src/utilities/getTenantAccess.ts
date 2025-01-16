import type { Where } from 'payload'

import type { UserWithTenantsField } from '../types.js'

import { getUserTenantIDs } from './getUserTenantIDs.js'

type Args = {
  fieldName: string
  user: UserWithTenantsField
}
export function getTenantAccess({ fieldName, user }: Args): Where {
  const userAssignedTenantIDs = getUserTenantIDs(user)

  return {
    [fieldName]: {
      in: userAssignedTenantIDs || [],
    },
  }
}
