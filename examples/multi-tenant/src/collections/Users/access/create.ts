import type { Access } from 'payload'

import type { User } from '../../../payload-types'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getUserTenantIDs } from '../../../utilities/getUserTenantIDs'

export const createAccess: Access<User> = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isSuperAdmin(req.user)) {
    return true
  }

  const adminTenantAccessIDs = getUserTenantIDs(req.user, 'tenant-admin')

  if (adminTenantAccessIDs.length) {
    return true
  }

  return false
}
