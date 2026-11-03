import type { AuthenticatedUser, AuthStrategy } from '../types.js'

import { Forbidden } from '../../errors/index.js'
import { createAuthToken } from '../createAuthToken.js'
import { redeemRefreshToken } from '../redeemRefreshToken.js'
import { JWTAuthentication } from './jwt.js'

/** Issues a Payload login token and a refresh token for the user the request is logged in as. */
export const issueJWTToken: NonNullable<AuthStrategy['issueToken']> = async ({ req }) => {
  if (!req.user) {
    throw new Forbidden(req.t)
  }

  const collectionConfig = req.payload.collections[req.user.collection]!.config

  // The full document, like the one a password login starts its session on
  const user = await req.payload.db.findOne<AuthenticatedUser>({
    collection: collectionConfig.slug,
    req,
    where: { id: { equals: req.user.id } },
  })

  if (!user) {
    throw new Forbidden(req.t)
  }

  const { refreshToken, token } = await createAuthToken({
    collectionConfig,
    email: user.email as string,
    req,
    shouldCreateRefreshToken: true,
    user,
  })

  return { accessToken: token, expiresIn: collectionConfig.auth.tokenExpiration, refreshToken }
}

/** Trades a refresh token from `issueJWTToken` or an earlier refresh for new tokens. */
export const refreshJWTToken: NonNullable<AuthStrategy['refreshToken']> = async ({
  refreshToken,
  req,
}) => {
  const refreshed = await redeemRefreshToken({ refreshToken, req })

  return (
    refreshed && {
      accessToken: refreshed.token,
      expiresIn: refreshed.collectionConfig.auth.tokenExpiration,
      refreshToken: refreshed.refreshToken,
    }
  )
}

/** Finds the user of a Payload login token, like a request sending it in its headers. */
export const authenticateJWTToken: NonNullable<AuthStrategy['authenticateToken']> = async ({
  req,
  token,
}) => {
  const { user } = await JWTAuthentication({
    headers: new Headers({ Authorization: `JWT ${token}`, DisableAutologin: 'true' }),
    payload: req.payload,
    req,
  })

  return user
}
