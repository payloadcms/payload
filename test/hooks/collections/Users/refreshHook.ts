import type { RefreshHook } from '../../../../packages/payload/src/collections/config/types'

export const refreshHook: RefreshHook = ({ user }) => {
  if (user.email === 'dontrefresh@payloadcms.com') {
    return {
      exp: 1,
      refreshedToken: 'fake',
      strategy: 'local-jwt',
      user,
    }
  }
}
