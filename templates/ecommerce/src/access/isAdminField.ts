import type { FieldAccess } from 'payload'

import { checkRole } from '@/access/utilities'

export const isAdminField: FieldAccess = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user)

  return false
}
