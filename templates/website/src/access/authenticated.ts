import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

export const authenticated = ({ req: { user } }: AccessArgs<User>): boolean => {
  return Boolean(user)
}
