import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { type JsonObject, type Payload, type TypedUser } from '../../../index.js'
import { isUserLocked } from '../../isUserLocked.js'

type Args = {
  collection: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  user: TypedUser
}

// Note: this function does not use req in most updates, as we want those to be visible in parallel requests that are on a different
// transaction. At the same time, we want updates from parallel requests to be visible here.
export const incrementLoginAttempts = async ({
  collection,
  payload,
  req,
  user,
}: Args): Promise<void> => {
  const {
    auth: { lockTime, maxLoginAttempts },
  } = collection

  const currentTime = Date.now()

  let updatedLockUntil: null | string = null
  let updatedLoginAttempts: null | number = null

  if (user.lockUntil && !isUserLocked(new Date(user.lockUntil))) {
    // Expired lock, restart count at 1
    const updatedUser = await payload.db.updateOne({
      id: user.id,
      collection: collection.slug,
      data: {
        lockUntil: null,
        loginAttempts: 1,
      },
      req,
      select: {
        lockUntil: true,
        loginAttempts: true,
      },
    })
    updatedLockUntil = updatedUser.lockUntil
    updatedLoginAttempts = updatedUser.loginAttempts
    user.lockUntil = updatedLockUntil
  } else {
    const data: JsonObject = {
      loginAttempts: {
        $inc: 1,
      },
    }

    const willReachMaxAttempts =
      typeof user.loginAttempts === 'number' && user.loginAttempts + 1 >= maxLoginAttempts
    // Lock the account if at max attempts and not already locked
    if (willReachMaxAttempts) {
      const lockUntil = new Date(currentTime + lockTime).toISOString()
      data.lockUntil = lockUntil
    }

    const updatedUser = await payload.db.updateOne({
      id: user.id,
      collection: collection.slug,
      data,
      select: {
        lockUntil: true,
        loginAttempts: true,
      },
    })

    updatedLockUntil = updatedUser.lockUntil
    updatedLoginAttempts = updatedUser.loginAttempts
  }

  if (updatedLoginAttempts === null) {
    throw new Error('Failed to update login attempts or lockUntil for user')
  }

  // Check updated latest lockUntil and loginAttempts in case there were parallel updates
  const reachedMaxAttemptsForCurrentUser =
    typeof updatedLoginAttempts === 'number' && updatedLoginAttempts - 1 >= maxLoginAttempts

  const reachedMaxAttemptsForNextUser =
    typeof updatedLoginAttempts === 'number' && updatedLoginAttempts >= maxLoginAttempts

  if (reachedMaxAttemptsForCurrentUser) {
    user.lockUntil = updatedLockUntil
  }
  user.loginAttempts = updatedLoginAttempts - 1 // -1, as the updated increment is applied for the *next* login attempt, not the current one

  if (
    reachedMaxAttemptsForNextUser &&
    (!updatedLockUntil || !isUserLocked(new Date(updatedLockUntil)))
  ) {
    // If lockUntil reached max login attempts due to multiple parallel attempts but user was not locked yet,
    const newLockUntil = new Date(currentTime + lockTime).toISOString()

    await payload.db.updateOne({
      id: user.id,
      collection: collection.slug,
      data: {
        lockUntil: newLockUntil,
      },
      returning: false,
    })

    if (reachedMaxAttemptsForCurrentUser) {
      user.lockUntil = newLockUntil
    }

    if (collection.auth.useSessions) {
      // Remove all active sessions that have been created in a 20 second window. This protects
      // against brute force attacks - example: 99 incorrect, 1 correct parallel login attempts.
      // The correct login attempt will be finished first, as it's faster due to not having to perform
      // an additional db update here.
      // However, this request (the incorrect login attempt request) can kill the successful login attempt here.

      // Fetch user sessions separately (do not do this in the updateOne select in order to preserve the returning: true db call optimization)
      const currentUser = await payload.db.findOne<TypedUser>({
        collection: collection.slug,
        select: {
          sessions: true,
        },
        where: {
          id: {
            equals: user.id,
          },
        },
      })
      if (currentUser?.sessions?.length) {
        // Does not hurt also removing expired sessions
        currentUser.sessions = currentUser.sessions.filter((session) => {
          const sessionCreatedAt = new Date(session.createdAt)
          const twentySecondsAgo = new Date(currentTime - 20000)

          // Remove sessions created within the last 20 seconds
          return sessionCreatedAt <= twentySecondsAgo
        })

        user.sessions = currentUser.sessions

        // Ensure updatedAt date is always updated
        user.updatedAt = new Date().toISOString()

        await payload.db.updateOne({
          id: user.id,
          collection: collection.slug,
          data: user,
          returning: false,
        })
      }
    }
  }
}
