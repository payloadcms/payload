import type { RefreshHook } from 'node_modules/payload/src/collections/config/types.js'

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
