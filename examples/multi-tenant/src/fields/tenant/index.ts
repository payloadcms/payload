import type { Field } from 'payload/types'

import { superAdminFieldAccess } from '../../access/superAdmins'
import { isSuperAdmin } from '../../utilities/isSuperAdmin'
import { tenantAdminFieldAccess } from './access/tenantAdmins'

export const tenant: Field = {
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
  // don't require this field because we need to auto-populate it, see below
  // required: true,
  // we also don't want to hide this field because super-admins may need to manage it
  // to achieve this, create a custom component that conditionally renders the field based on the user's role
  // hidden: true,
  index: true,
  admin: {
    position: 'sidebar',
  },
  access: {
    create: superAdminFieldAccess,
    read: tenantAdminFieldAccess,
    update: superAdminFieldAccess,
  },
  hooks: {
    // automatically set the tenant to the last logged in tenant
    // for super admins, allow them to set the tenant
    beforeChange: [
      async ({ req, req: { user }, data }) => {
        if ((await isSuperAdmin(req.user)) && data?.tenant) {
          return data.tenant
        }

        if (user?.lastLoggedInTenant?.id) {
          return user.lastLoggedInTenant.id
        }

        return undefined
      },
    ],
  },
}
