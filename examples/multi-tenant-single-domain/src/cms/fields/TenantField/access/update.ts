import type { FieldAccess } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin.js'
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs.js'

export const tenantFieldUpdate: FieldAccess = (args) => {
  const tenantIDs = getTenantAccessIDs(args.req.user)
  return Boolean(isSuperAdmin(args) || tenantIDs.length > 0)
}
