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

export const incrementLoginAttempts = async ({
  collection,
  payload,
  req,
  user,
}: Args): Promise<void> => {
  const {
    auth: { lockTime, maxLoginAttempts },
  } = collection

  if (user.lockUntil && !isUserLocked(new Date(user.lockUntil))) {
    // Expired lock, restart count at 1
    await payload.db.updateOne({
      id: user.id,
      collection: collection.slug,
      data: {
        lockUntil: null,
        loginAttempts: 1,
      },
      req,
      returning: false,
    })
    user.lockUntil = null
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
      const lockUntil = new Date(Date.now() + lockTime).toISOString()
      data.lockUntil = lockUntil
    }

    await payload.db.updateOne({
      id: user.id,
      collection: collection.slug,
      data,
      returning: false,
    })
  }

  // Fetch updated user to get latest lockUntil and loginAttempts in case there were parallel updates

  const { lockUntil: updatedLockUntil, loginAttempts: updatedLoginAttempts } =
    (await payload.db.findOne({
      collection: collection.slug,
      select: {
        lockUntil: true,
        loginAttempts: true,
      },
      where: {
        id: {
          equals: user.id,
        },
      },
    })) as unknown as TypedUser

  const reachedMaxAttemptsForCurrentUser =
    typeof updatedLoginAttempts === 'number' && updatedLoginAttempts - 1 >= maxLoginAttempts

  const reachedMaxAttemptsForNextUser =
    typeof user.loginAttempts === 'number' && updatedLoginAttempts >= maxLoginAttempts

  if (reachedMaxAttemptsForCurrentUser) {
    user.lockUntil = updatedLockUntil
  }
  user.loginAttempts = updatedLoginAttempts - 1 // -1, as the updated increment is applied for the *next* login attempt, not the current one

  if (
    reachedMaxAttemptsForNextUser &&
    (!updatedLockUntil || !isUserLocked(new Date(updatedLockUntil)))
  ) {
    // If lockUntil reached max login attempts due to multiple parallel attempts but user was not locked yet,
    const newLockUntil = new Date(Date.now() + lockTime).toISOString()

    await payload.db.updateOne({
      id: user.id,
      collection: collection.slug,
      data: {
        lockUntil: newLockUntil,
      },
      returning: false,
    })
  }
}
