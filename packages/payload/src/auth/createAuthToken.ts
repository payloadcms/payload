import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { AuthenticatedUser } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { getFieldsToSign } from './getFieldsToSign.js'
import { jwtSign } from './jwt.js'
import { createRefreshToken } from './redeemRefreshToken.js'
import { addSessionToUser } from './sessions.js'

/**
 * Starts a login session for the user and signs the JWT for it, the same token a password login
 * returns. Payload's JWT strategy accepts it. The session is saved on the user right away.
 */
export const createAuthToken = async ({
  collectionConfig,
  email,
  req,
  shouldCreateRefreshToken = false,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  /** The `email` claim of the token. */
  email: string
  req: PayloadRequest
  /**
   * Also return a refresh token for the session, which `redeemRefreshToken` trades for a new token.
   * The session then lasts `auth.refreshTokens.expiration` from each refresh. Only works when the
   * collection enables `auth.refreshTokens`.
   */
  shouldCreateRefreshToken?: boolean
  user: AuthenticatedUser
}): Promise<{
  exp: number
  refreshToken?: string
  /**
   * The ID of the session the token belongs to. Removing that session from the user, like logout
   * does, makes the token stop working.
   */
  sid?: string
  token: string
}> => {
  const refreshTokens = shouldCreateRefreshToken && collectionConfig.auth.refreshTokens

  const { session, sid } = await addSessionToUser({
    collectionConfig,
    payload: req.payload,
    req,
    sessionExpiration: refreshTokens ? refreshTokens.expiration : undefined,
    user,
  })

  const { exp, token } = await jwtSign({
    fieldsToSign: getFieldsToSign({ collectionConfig, email, sid, user }),
    secret: req.payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  return {
    exp,
    refreshToken:
      refreshTokens && session
        ? createRefreshToken({ collectionConfig, req, session, userID: user.id })
        : undefined,
    sid,
    token,
  }
}
