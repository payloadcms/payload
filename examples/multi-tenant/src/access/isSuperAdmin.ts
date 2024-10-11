import type { Access } from 'payload'

export const isSuperAdmin: Access = ({ req }) => {
  if (!req?.user) {
    return false
  }
  return Boolean(req.user.roles?.includes('super-admin'))
}
