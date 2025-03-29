import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

import { checkRole } from '@/access/checkRole'

type isAdmin = (args: AccessArgs<User>) => boolean

export const admins: isAdmin = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user)

  return false
}
