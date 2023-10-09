import type { Access } from 'payload/types'

import { isSuperAdmin } from '../../../utilities/isSuperAdmin'

export const tenants: Access = ({ req: { user }, data }) =>
  // individual documents
  (data?.tenant?.id && user?.lastLoggedInTenant?.id === data.tenant.id) ||
  (!user?.lastLoggedInTenant?.id && isSuperAdmin(user)) || {
    // list of documents
    tenant: {
      equals: user?.lastLoggedInTenant?.id,
    },
  }
