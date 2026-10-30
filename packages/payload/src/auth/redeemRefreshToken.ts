import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { AuthenticatedUser, UserSession } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { appendNonTrashedFilter } from '../utilities/appendNonTrashedFilter.js'
import { assertNoValidationWrite } from '../utilities/assertNoValidationWrite.js'
import { getFieldsToSign } from './getFieldsToSign.js'
import { jwtSign } from './jwt.js'
import { extendSession, removeExpiredSessions, revokeSession } from './sessions.js'

/**
 * How long the refresh token from right before the latest refresh still works, in milliseconds.
 * Clients that send requests in parallel can refresh twice at once.
 */
const reuseInterval = 30 * 1000

/** What a refresh token points to. It's encrypted, so clients can't read or change it. */
type RefreshTokenContents = {
  collection: string
  /** The session's `refreshCount` when the refresh token was created. */
  refreshCount: number
  sid: string
  userID: number | string
}

/**
 * Trades a refresh token from `createAuthToken` or an earlier refresh for a new token and a new
 * refresh token. Every refresh counts up the session's `refreshCount`, which the refresh token
 * remembers, so a refresh token with an older count was already used. That means it was copied, and
 * its session is logged out.
 *
 * The refresh operation uses it when it gets a refresh token. Plugins can also call it directly,
 * since it needs nothing but the refresh token.
 *
 * @returns `null` when the refresh token is invalid, its session ended, it was reused, or its user
 * is in the trash or not verified
 */
export const redeemRefreshToken = async ({
  collection,
  refreshToken,
  req,
}: {
  /** Only accept refresh tokens of this collection. */
  collection?: string
  refreshToken: string
  req: PayloadRequest
}): Promise<{
  collectionConfig: SanitizedCollectionConfig
  exp: number
  refreshToken: string
  token: string
  user: AuthenticatedUser
} | null> => {
  assertNoValidationWrite(req)

  const contents = readRefreshToken({ refreshToken, req })
  const collectionConfig = contents && req.payload.collections[contents.collection]?.config
  // Without auth.refreshTokens, sessions have no refreshCount to check refresh tokens against
  const refreshTokens = collectionConfig?.auth.refreshTokens

  if (
    !contents ||
    !collectionConfig ||
    !refreshTokens ||
    (collection && collection !== contents.collection)
  ) {
    return null
  }

  const user = await req.payload.db.findOne<AuthenticatedUser>({
    collection: collectionConfig.slug,
    req,
    where: appendNonTrashedFilter({
      enableTrash: Boolean(collectionConfig.trash),
      trash: false,
      where: { id: { equals: contents.userID } },
    }),
  })
  const session = removeExpiredSessions(user?.sessions ?? []).find(({ id }) => id === contents.sid)

  // The JWT strategy wouldn't accept a token for a user who isn't verified
  if (!user || !session || (collectionConfig.auth.verify && !user._verified)) {
    return null
  }

  const refreshCount = session.refreshCount ?? 0
  const refreshedAt = session.refreshedAt ? new Date(session.refreshedAt).getTime() : 0

  if (contents.refreshCount === refreshCount) {
    // Refreshes at the same moment all save the same count, so their refresh tokens all stay current
    session.refreshCount = refreshCount + 1
    session.refreshedAt = new Date()

    // Saves the session with its new count, too
    await extendSession({
      collectionConfig,
      req,
      sessionExpiration: refreshTokens.expiration,
      sid: session.id,
      user,
    })
  } else if (
    contents.refreshCount !== refreshCount - 1 ||
    Date.now() - refreshedAt >= reuseInterval
  ) {
    await revokeSession({ collectionConfig, payload: req.payload, req, sid: session.id, user })

    return null
  }
  // Otherwise the client refreshed twice at once, and gets the current session again

  const { exp, token } = await jwtSign({
    fieldsToSign: getFieldsToSign({ collectionConfig, email: user.email!, sid: session.id, user }),
    secret: req.payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  return {
    collectionConfig,
    exp,
    refreshToken: createRefreshToken({ collectionConfig, req, session, userID: user.id }),
    token,
    user,
  }
}

export const createRefreshToken = ({
  collectionConfig,
  req,
  session,
  userID,
}: {
  collectionConfig: SanitizedCollectionConfig
  req: PayloadRequest
  session: UserSession
  userID: number | string
}): string =>
  req.payload.encrypt(
    JSON.stringify({
      collection: collectionConfig.slug,
      refreshCount: session.refreshCount ?? 0,
      sid: session.id,
      userID,
    } satisfies RefreshTokenContents),
  )

const readRefreshToken = ({
  refreshToken,
  req,
}: {
  refreshToken: string
  req: PayloadRequest
}): RefreshTokenContents | undefined => {
  // Only the v1 format is authenticated. Older formats decrypt anything without an error.
  if (!refreshToken.startsWith('v1:')) {
    return undefined
  }

  try {
    // Only the current secret, since previous secrets can be public, like a default from source code
    return JSON.parse(req.payload.decrypt(refreshToken, { secret: req.payload.config.secret }))
  } catch {
    return undefined
  }
}
