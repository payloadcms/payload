import type { MeHook } from 'node_modules/payload/src/collections/config/types.js'

export const meHook: MeHook = ({ user }) => {
  if (user.email === 'dontrefresh@payloadcms.com') {
    return {
      exp: 10000,
      user,
    }
  }
}
