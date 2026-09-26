import { v4 as uuid } from 'uuid'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { AuthenticatedUser, User, UserSession } from '../index.js'
import type { Payload, PayloadRequest } from '../types/index.js'

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
 * @returns The session ID (sid) if sessions are used
 */
export const addSessionToUser = async ({
  collectionConfig,
  payload,
  req,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  user: AuthenticatedUser
}): Promise<{ sid?: string }> => {
  let sid: string | undefined
  if (collectionConfig.auth.useSessions) {
    // Add session to user
    sid = uuid()
    const now = new Date()
    const tokenExpInMs = collectionConfig.auth.tokenExpiration * 1000
    const expiresAt = new Date(now.getTime() + tokenExpInMs)

    const session = { id: sid, createdAt: now, expiresAt }

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
    sid,
  }
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
