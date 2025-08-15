import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

export const isAdmin: Access = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user)

  return false
}
