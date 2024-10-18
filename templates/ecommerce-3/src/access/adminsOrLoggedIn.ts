import type { Access, AccessArgs } from 'payload'

import type { User } from '@/payload-types'

import { checkRole } from '@/access/checkRole'

export const adminsOrLoggedIn: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (user) {
    return checkRole(['admin'], user)
  }

  return !!user
}
