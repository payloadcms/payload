import type { Where } from 'payload'

import type { UserWithTenantsField } from '../types.js'

import { getUserTenantIDs } from './getUserTenantIDs.js'

export function getTenantAccess({ user }): null | Where {
  const userAssignedTenantIDs = getUserTenantIDs(user as UserWithTenantsField)

  if (userAssignedTenantIDs.length) {
    return {
      tenant: {
        in: userAssignedTenantIDs,
      },
    }
  }

  return null
}
