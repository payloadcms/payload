import type { AccessArgs } from 'payload'

import type { User } from '../../payload-types'

import { checkRole } from '../collections/Users/checkRole'

type isAdmin = (args: AccessArgs<User>) => boolean

export const admins: isAdmin = ({ req: { user } }) => {
  return checkRole(['admin'], user)
}
