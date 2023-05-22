import type { Access } from 'payload/types'

import { isSuperAdmin } from '../../utilities/isSuperAdmin'

export const tenants: Access = ({ req: { user }, data }) =>
  isSuperAdmin(user) ||
  // individual documents
  (data?.tenant?.id && user?.lastLoggedInTenant?.id === data.tenant.id) || {
    // list of documents
    tenant: {
      equals: user?.lastLoggedInTenant?.id,
    },
  }
