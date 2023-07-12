import type { Access } from 'payload/config'

import { checkRole } from '../../Users/checkRole'

export const adminsAndOrderedBy: Access = ({ req: { user } }) => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }

    return {
      'orderedBy.user.id': user.id,
    }
  }

  return true
}
