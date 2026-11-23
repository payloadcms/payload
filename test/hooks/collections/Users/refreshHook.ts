import type { CollectionRefreshHook } from 'payload'

export const refreshHook: CollectionRefreshHook = ({ user }) => {
  if (user.email === 'dontrefresh@payloadcms.com') {
    return {
      exp: 1,
      refreshedToken: 'fake',
      user,
    }
  }
}
