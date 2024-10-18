import type { Access } from 'payload'

import { checkRole } from '@/access/checkRole'

export const adminsOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    return checkRole(['admin'], user)
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
