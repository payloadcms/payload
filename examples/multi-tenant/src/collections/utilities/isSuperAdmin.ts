import type { User } from 'payload/generated-types'

import { checkUserRoles } from './checkUserRoles'

export const isSuperAdmin = (user: User): boolean => {
  if (user?.email === 'dev@payloadcms.com') return true // for the seed script, remove this in production
  return checkUserRoles(['super-admin'], user)
}
