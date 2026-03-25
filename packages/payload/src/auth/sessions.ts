import { v4 as uuid } from 'uuid'

import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { TypedUser } from '../index.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { UntypedUser, UserSession } from './types.js'

/**
 * Removes expired sessions from an array of sessions
 */
export const removeExpiredSessions = (sessions: UserSession[]) => {
  const now = new Date()

  return sessions.filter(({ expiresAt }) => {
    const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
    return expiry > now
  })
}

/**
 * Adds a session to the user and removes expired sessions.
 *
 * To avoid a race condition where concurrent logins read the same stale
 * `sessions` array and one overwrites the other (last-write-wins), this
 * function now performs a fresh read of the user's current sessions from the
 * database before appending the new session. Because this runs inside the
 * login transaction, the read-modify-write sequence is atomic with respect
 * to other concurrent login transactions.
 *
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
  user: TypedUser
}): Promise<{ sid?: string }> => {
  let sid: string | undefined
  if (collectionConfig.auth.useSessions) {
    sid = uuid()
    const now = new Date()
    const tokenExpInMs = collectionConfig.auth.tokenExpiration * 1000
    const expiresAt = new Date(now.getTime() + tokenExpInMs)

    const newSession: UserSession = { id: sid, createdAt: now, expiresAt }

    // Read fresh session data from DB to avoid stale-read race conditions
    // during concurrent logins. The surrounding transaction in loginOperation
    // ensures this read-modify-write is serialized per user.
    const freshUser = await payload.db.findOne<TypedUser>({
      collection: collectionConfig.slug,
      req,
      select: {
        sessions: true,
      },
      where: { id: { equals: user.id } },
    })

    const existingSessions = freshUser?.sessions ?? []
    const activeSessions = removeExpiredSessions(existingSessions)
    activeSessions.push(newSession)

    // Update only the sessions field to minimize write conflicts
    await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: {
        sessions: activeSessions,
        // Prevent updatedAt from being updated when only adding a session
        updatedAt: null,
      } as Partial<TypedUser>,
      req,
      returning: false,
    })

    // Keep the in-memory user object consistent
    user.sessions = activeSessions
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
  user: null | (TypeWithID & UntypedUser)
}): Promise<void> => {
  if (collectionConfig.auth.useSessions && user && user.sessions?.length) {
    // Read fresh sessions from DB to avoid revoking based on stale data
    const freshUser = await payload.db.findOne<TypedUser>({
      collection: collectionConfig.slug,
      req,
      select: {
        sessions: true,
      },
      where: { id: { equals: user.id } },
    })

    if (freshUser?.sessions?.length) {
      const updatedSessions = freshUser.sessions.filter((session) => session.id !== sid)
      await payload.db.updateOne({
        id: user.id,
        collection: collectionConfig.slug,
        data: {
          sessions: updatedSessions,
        } as Partial<TypedUser>,
        req,
        returning: false,
      })
      user.sessions = updatedSessions
    }
  }
}
