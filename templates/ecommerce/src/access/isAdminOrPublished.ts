import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

export const isAdminOrPublished: Access = ({ req: { user } }) => {
  if (user && checkRole(['admin'], user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
