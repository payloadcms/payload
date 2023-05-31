import type { Access } from 'payload/types'

export const lastLoggedInTenant: Access = ({ req: { user }, data }) =>
  user?.lastLoggedInTenant?.id === data?.id
