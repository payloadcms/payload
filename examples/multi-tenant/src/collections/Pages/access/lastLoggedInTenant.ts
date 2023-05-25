import type { Access } from 'payload/types'

import { checkUserRoles } from '../../utilities/checkUserRoles'

export const lastLoggedInTenant: Access = ({ req: { user }, data }) =>
  checkUserRoles(['super-admin'], user) || user?.lastLoggedInTenant?.id === data?.id
