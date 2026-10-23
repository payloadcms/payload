import type { PayloadRequest } from 'payload'

import { APIError, createAuthToken, refreshAuthToken } from 'payload'

import type { MCPOAuthTokens } from '../types.js'

/**
 * The default `issueToken`: a Payload login token, which Payload's JWT strategy accepts. When the
 * collection uses sessions, the client also gets a refresh token for the token's session.
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

  return { accessToken: token, expiresIn: collectionConfig.auth.tokenExpiration, refreshToken }
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
      accessToken: refreshed.token,
      expiresIn: refreshed.collectionConfig.auth.tokenExpiration,
      refreshToken: refreshed.refreshToken,
    }
  )
}
