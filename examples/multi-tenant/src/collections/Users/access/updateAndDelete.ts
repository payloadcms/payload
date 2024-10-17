import type { Access } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAdminTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const updateAndDeleteAccess: Access = (args) => {
  const { req } = args
  if (!req.user) {return false}

  if (isSuperAdmin(args)) {return true}

  const adminTenantAccessIDs = getTenantAdminTenantAccessIDs(req.user)

  return {
    'tenants.tenant': {
      in: adminTenantAccessIDs,
    },
  }
}
