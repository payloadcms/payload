import type { PayloadRequest } from 'payload'

import { APIError, createAuthToken, executeAuthStrategies, refreshAuthToken } from 'payload'

import type { MCPOAuthTokens } from '../types.js'

import { seal, unseal } from '../utils/seal.js'

/**
 * The default `issueToken`: a Payload login token, sealed so it only works for MCP, where
 * `authenticateLoginToken` unseals it. Otherwise an MCP client could use it as the user's admin
 * panel login. When the collection uses sessions, the client also gets a refresh token.
 */
export const issueLoginToken = async ({
  req,
}: {
  req: PayloadRequest
}): Promise<MCPOAuthTokens> => {
  const collectionConfig = req.payload.collections[req.user!.collection]!.config

  if (collectionConfig.auth.disableLocalStrategy) {
    throw new APIError(
      `MCP clients can't get Payload login tokens for the "${collectionConfig.slug}" collection because its local strategy is disabled. Pass oauth.issueToken to the MCP plugin.`,
    )
  }

  // The full document, like the one a password login starts its session on
  const user = (await req.payload.db.findOne<NonNullable<PayloadRequest['user']>>({
    collection: collectionConfig.slug,
    req,
    where: { id: { equals: req.user!.id } },
  }))!

  const { refreshToken, token } = await createAuthToken({
    collectionConfig,
    email: user.email!,
    req,
    shouldCreateRefreshToken: true,
    user,
  })

  return {
    accessToken: sealLoginToken({ req, token }),
    expiresIn: collectionConfig.auth.tokenExpiration,
    refreshToken,
  }
}

/** The default `refreshToken`. Payload logs out the session when a refresh token is reused. */
export const refreshLoginToken = async ({
  refreshToken,
  req,
}: {
  refreshToken: string
  req: PayloadRequest
}): Promise<MCPOAuthTokens | null> => {
  const refreshed = await refreshAuthToken({ refreshToken, req })

  return (
    refreshed && {
      accessToken: sealLoginToken({ req, token: refreshed.token }),
      expiresIn: refreshed.collectionConfig.auth.tokenExpiration,
      refreshToken: refreshed.refreshToken,
    }
  )
}

/** Finds the user of an MCP request's access token from `issueLoginToken`. */
export const authenticateLoginToken = async ({
  req,
  token,
}: {
  req: PayloadRequest
  token: string
}): Promise<PayloadRequest['user']> => {
  const loginToken = unseal<{ token: string }>({ type: 'access', req, value: token })

  if (!loginToken) {
    return null
  }

  const headers = new Headers({
    Authorization: `JWT ${loginToken.token}`,
    DisableAutologin: 'true',
  })

  return (await executeAuthStrategies({ headers, payload: req.payload, req })).user
}

const sealLoginToken = ({ req, token }: { req: PayloadRequest; token: string }): string =>
  seal({ type: 'access', data: { token }, req })
