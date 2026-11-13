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
  type,
  collectionConfig,
  label,
  metadata,
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
} & Pick<UserSession, 'label' | 'metadata' | 'type'>): Promise<{
  session?: UserSession
  sid?: string
}> => {
  assertNoValidationWrite(req)

  let session: undefined | UserSession
  let sid: string | undefined
  if (collectionConfig.auth.useSessions) {
    // Add session to user
    sid = uuid()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + sessionExpiration * 1000)

    session = { id: sid, type, createdAt: now, expiresAt, label, metadata }

    // Store the new session in memory to reflect it in the response, without
    // writing the full sessions array back to the database. Concurrent logins
    // each read the same sessions array, so writing it back would silently
    // drop the sessions the other logins have added in the meantime.
    user.sessions = [...removeExpiredSessions(user.sessions ?? []), session]

    await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: {
        sessions: { $push: session },
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
 * Extends the session `sid` so it lasts at least another `sessionExpiration`. Sessions that already
 * last longer, like ones with a refresh token, keep their expiry, since their refresh token relies
 * on it.
 *
 * @returns The session, or `undefined` when the user has no session with this ID
 */
export const extendSession = async ({
  collectionConfig,
  req,
  sessionExpiration = collectionConfig.auth.tokenExpiration,
  sid,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  req: PayloadRequest
  /**
   * Seconds the session lasts at least, from now.
   *
   * @default collectionConfig.auth.tokenExpiration
   */
  sessionExpiration?: number
  sid: string
  user: AuthenticatedUser
}): Promise<undefined | UserSession> => {
  assertNoValidationWrite(req)

  const session = user.sessions?.find(({ id }) => id === sid)

  if (!session) {
    return undefined
  }

  const expiresAt = new Date(Date.now() + sessionExpiration * 1000)

  if (new Date(session.expiresAt) < expiresAt) {
    session.expiresAt = expiresAt
  }

  await req.payload.db.updateOne({
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
