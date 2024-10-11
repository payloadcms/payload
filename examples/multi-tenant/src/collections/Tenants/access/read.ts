import type { Access } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const tenantRead: Access = (args) => {
  const req = args.req

  // Super admin can read all
  if (isSuperAdmin(args)) {return true}

  const tenantIDs = getTenantAccessIDs(req.user)

  // Allow public tenants to be read by anyone
  const publicConstraint = {
    public: {
      equals: true,
    },
  }

  // If a user has tenant ID access,
  // return constraint to allow them to read those tenants
  if (tenantIDs.length) {
    return {
      or: [
        publicConstraint,
        {
          id: {
            in: tenantIDs,
          },
        },
      ],
    }
  }

  return publicConstraint
}
