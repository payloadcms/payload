import { status as httpStatus } from 'http-status'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
} from '../../collections/config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError } from '../../errors/index.js'
import { combineQueries, Forbidden } from '../../index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { executeAccess } from '../executeAccess.js'
import { getLoginOptions } from '../getLoginOptions.js'
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

  const loginWithUsername = collectionConfig.auth.loginWithUsername

  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername)

  const sanitizedEmail = canLoginWithEmail && (args.data?.email || '').toLowerCase().trim()
  const sanitizedUsername =
    (canLoginWithUsername &&
      'username' in args.data &&
      typeof args.data.username === 'string' &&
      args.data.username.toLowerCase().trim()) ||
    null

  if (collectionConfig.auth.disableLocalStrategy) {
    throw new Forbidden(req.t)
  }
  if (!sanitizedEmail && !sanitizedUsername) {
    throw new APIError(
      `Missing ${collectionConfig.auth.loginWithUsername ? 'username' : 'email'}.`,
      httpStatus.BAD_REQUEST,
    )
  }

  try {
    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'unlock',
      overrideAccess,
    })

    const shouldCommit = await initTransaction(req)
    let whereConstraint: Where = {}

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      const accessResult = await executeAccess({ req }, collectionConfig.access.unlock)

      if (accessResult && typeof accessResult === 'object') {
        whereConstraint = accessResult
      }
    }

    // /////////////////////////////////////
    // Unlock
    // /////////////////////////////////////

    if (canLoginWithEmail && sanitizedEmail) {
      whereConstraint = combineQueries(whereConstraint, {
        email: {
          equals: sanitizedEmail,
        },
      })
    } else if (canLoginWithUsername && sanitizedUsername) {
      whereConstraint = combineQueries(whereConstraint, {
        username: {
          equals: sanitizedUsername,
        },
      })
    }

    // Exclude trashed users unless `trash: true`
    whereConstraint = appendNonTrashedFilter({
      enableTrash: Boolean(collectionConfig.trash),
      trash: false,
      where: whereConstraint,
    })

    const user = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      locale: locale!,
      req,
      where: whereConstraint,
    })

    let result: boolean | null = null

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
      throw new Forbidden(req.t)
    }

    if (shouldCommit) {
      await commitTransaction(req)
    }

    result = await buildAfterOperation({
      args,
      collection: args.collection.config,
      operation: 'unlock',
      overrideAccess,
      result,
    })

    return Boolean(result)
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
