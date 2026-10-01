import type { Access } from '../config/types.js'

export const defaultUnlockAccess: Access = ({ req: { payload, user } }) => {
  if (!user) {
    return false
  }

  return user.collection === payload.config.admin.user
}
