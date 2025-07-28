import type { Access, AccessArgs } from 'payload'

import type { User } from '@/payload-types'

import { checkRole } from '@/access/checkRole'

export const authenticated: Access = ({ req: { user } }: AccessArgs<User>) => {
  return !!user
}
