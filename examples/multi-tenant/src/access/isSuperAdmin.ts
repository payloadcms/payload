import { userRole } from '@/collections/Users/roles'
import type { Access } from 'payload'

export const isSuperAdmin: Access = ({ req }) => {
  if (!req?.user) {
    return false
  }
  return Boolean(req.user.roles?.includes(userRole.SUPER_ADMIN))
}
