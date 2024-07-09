import httpStatus from 'http-status'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
} from '../../collections/config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import executeAccess from '../executeAccess.js'
import { resetLoginAttempts } from '../strategies/local/resetLoginAttempts.js'

export type Arguments<TSlug extends CollectionSlug> = {
  collection: Collection
  data: AuthOperationsFromCollectionSlug<TSlug>['unlock']
  overrideAccess?: boolean
  req: PayloadRequest
}

export const unlockOperation = async <TSlug extends CollectionSlug>(
  args: Arguments<TSlug>,
): Promise<boolean> => {
  const {
    collection: { config: collectionConfig },
    overrideAccess,
    req: { locale },
    req,
  } = args

  const loginWithUsername = collectionConfig?.auth?.loginWithUsername
  const canLoginWithUsername = Boolean(loginWithUsername)
  const canLoginWithEmail = !loginWithUsername || loginWithUsername.allowEmailLogin

  const sanitizedIncomingEmail = canLoginWithEmail && (args?.data?.email || '').toLowerCase().trim()
  const incomingUsername =
    (canLoginWithUsername && 'username' in args.data && args.data.username) || ''

  if (!sanitizedIncomingEmail && !incomingUsername) {
    throw new APIError(
      `Missing ${collectionConfig.auth.loginWithUsername ? 'username' : 'email'}.`,
      httpStatus.BAD_REQUEST,
    )
  }

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ req }, collectionConfig.access.unlock)
    }

    // /////////////////////////////////////
    // Unlock
    // /////////////////////////////////////

    let whereConstraint: Where = {}

    if (canLoginWithEmail && sanitizedIncomingEmail) {
      whereConstraint = {
        email: {
          equals: sanitizedIncomingEmail,
        },
      }
    } else if (canLoginWithUsername && incomingUsername) {
      whereConstraint = {
        username: {
          equals: incomingUsername,
        },
      }
    }

    const user = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      locale,
      req,
      where: whereConstraint,
    })

    let result

    if (user) {
      await resetLoginAttempts({
        collection: collectionConfig,
        doc: user,
        payload: req.payload,
        req,
      })
      result = true
    } else {
      result = null
    }

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
