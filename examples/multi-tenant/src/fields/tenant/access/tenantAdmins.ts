import type { FieldAccess } from 'payload/types'

import { checkUserRoles } from '../../../utilities/checkUserRoles'

export const tenantAdminFieldAccess: FieldAccess = ({ req: { user }, doc }) => {
  return (
    checkUserRoles(['super-admin'], user) ||
    !doc?.tenant ||
    (doc?.tenant &&
      user?.tenants?.some(
        ({ tenant: userTenant, roles }) =>
          (typeof doc?.tenant === 'string' ? doc?.tenant : doc?.tenant.id) === userTenant?.id &&
          roles?.includes('admin'),
      ))
  )
}
