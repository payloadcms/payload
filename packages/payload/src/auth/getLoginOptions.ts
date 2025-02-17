// @ts-strict-ignore
import type { Auth } from './types.js'

export const getLoginOptions = (
  loginWithUsername: Auth['loginWithUsername'],
): {
  canLoginWithEmail: boolean
  canLoginWithUsername: boolean
} => {
  return {
    canLoginWithEmail: !loginWithUsername || loginWithUsername.allowEmailLogin,
    canLoginWithUsername: Boolean(loginWithUsername),
  }
}
