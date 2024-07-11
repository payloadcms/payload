import type { Access, AccessArgs } from 'payload'

import type { User } from '../../payload-types'

import { checkRole } from '../collections/Users/checkRole'

export const adminsOrLoggedIn: Access = ({ req }: AccessArgs<User>) => {
  if (checkRole(['admin'], req.user)) {
    return true
  }

  return !!req.user
}
