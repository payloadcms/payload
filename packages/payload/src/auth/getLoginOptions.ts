import type { Auth } from './types.js'

/** @internal */
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
