import { v4 as uuid } from 'uuid'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { AuthenticatedUser, User, UserSession } from '../index.js'
import type { Payload, PayloadRequest } from '../types/index.js'

import { assertNoValidationWrite } from '../utilities/assertNoValidationWrite.js'

/**
 * Removes expired sessions from an array of sessions
 */
export const removeExpiredSessions = (sessions: UserSession[]): UserSession[] => {
  const now = new Date()

  return sessions.filter(({ expiresAt }) => {
    const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
    return expiry > now
  })
}

/**
 * Adds a session to the user and removes expired sessions
 * @returns The session and its ID (sid) if sessions are used
 */
export const addSessionToUser = async ({
  collectionConfig,
  payload,
  req,
  sessionExpiration = collectionConfig.auth.tokenExpiration,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  /**
   * Seconds until the session expires.
   *
   * @default collectionConfig.auth.tokenExpiration
   */
  sessionExpiration?: number
  user: AuthenticatedUser
}): Promise<{ session?: UserSession; sid?: string }> => {
  assertNoValidationWrite(req)

  let session: undefined | UserSession
  let sid: string | undefined
  if (collectionConfig.auth.useSessions) {
    // Add session to user
    sid = uuid()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + sessionExpiration * 1000)

    session = { id: sid, createdAt: now, expiresAt }

    if (!user.sessions?.length) {
      user.sessions = [session]
    } else {
      user.sessions = removeExpiredSessions(user.sessions)
      user.sessions.push(session)
    }

    await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: {
        ...user,
        // Prevent updatedAt from being updated when only adding a session
        updatedAt: null,
      },
      req,
      returning: false,
    })

    user.collection = collectionConfig.slug
    user._strategy = 'local-jwt'
  }

  return {
    session,
    sid,
  }
}

/**
 * Extends the session `sid` so it lasts at least another `tokenExpiration`. Sessions that already
 * last longer, like ones with a refresh token, keep their expiry, since their refresh token relies
 * on it.
 *
 * @returns The session, or `undefined` when the user has no session with this ID
 */
export const extendSession = async ({
  collectionConfig,
  payload,
  req,
  sid,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  sid: string
  user: AuthenticatedUser
}): Promise<undefined | UserSession> => {
  assertNoValidationWrite(req)

  const session = user.sessions?.find(({ id }) => id === sid)

  if (!session) {
    return undefined
  }

  const tokenExpiresAt = new Date(Date.now() + collectionConfig.auth.tokenExpiration * 1000)

  if (new Date(session.expiresAt) < tokenExpiresAt) {
    session.expiresAt = tokenExpiresAt
  }

  await payload.db.updateOne({
    id: user.id,
    collection: collectionConfig.slug,
    data: {
      ...user,
      // Prevent updatedAt from being updated when only extending a session
      sessions: removeExpiredSessions(user.sessions!),
      updatedAt: null,
    },
    req,
    returning: false,
  })

  return session
}

export const revokeSession = async ({
  collectionConfig,
  payload,
  req,
  sid,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  sid: string
  user: null | User
}): Promise<void> => {
  assertNoValidationWrite(req)

  if (collectionConfig.auth.useSessions && user && user.sessions?.length) {
    user.sessions = user.sessions.filter((session) => session.id !== sid)
    await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
      returning: false,
    })
  }
}
