import type { Access } from 'payload/config'

import { isSuperAdmin } from '../../../utilities/isSuperAdmin'

// the user must be an admin of the tenant being accessed
export const tenantAdmins: Access = ({ req: { user } }) => {
  if (isSuperAdmin(user)) {
    return true
  }

  return {
    id: {
      in:
        user?.tenants
          ?.map(({ tenant, roles }) =>
            roles.includes('admin') ? (typeof tenant === 'string' ? tenant : tenant.id) : null,
          ) // eslint-disable-line function-paren-newline
          .filter(Boolean) || [],
    },
  }
}
