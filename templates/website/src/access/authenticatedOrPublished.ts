import type { User } from '@/payload-types'

import type { AccessArgs, AccessResult } from 'payload'
import { authenticated } from './authenticated'

export const authenticatedOrPublished = (args: AccessArgs<User>): AccessResult => {
  if (authenticated(args)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
