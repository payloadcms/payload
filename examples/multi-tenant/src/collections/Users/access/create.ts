import type { Access } from 'payload'

import type { User } from '../../../payload-types'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAdminTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const createAccess: Access<User> = (args) => {
  const { req } = args
  if (!req.user) {return false}

  if (isSuperAdmin(args)) {return true}

  const adminTenantAccessIDs = getTenantAdminTenantAccessIDs(req.user)

  if (adminTenantAccessIDs.length > 0) {return true}

  return false
}
