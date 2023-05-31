import type { FieldAccess } from 'payload/types'

import { checkUserRoles } from '../../utilities/checkUserRoles'
import { checkTenantRoles } from '../utilities/checkTenantRoles'

export const tenantAdmins: FieldAccess = args => {
  const {
    req: { user },
    doc,
  } = args

  return (
    checkUserRoles(['super-admin'], user) ||
    doc?.tenants?.some(({ tenant }) => {
      const id = typeof tenant === 'string' ? tenant : tenant?.id
      return checkTenantRoles(['admin'], user, id)
    })
  )
}
