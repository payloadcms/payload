import type {
  AuthOperationsFromCollectionSlug,
  Collection,
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
} from '../../collections/config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, SelectType } from '../../types/index.js'

import { Forbidden } from '../../errors/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { ensureUsernameOrEmail } from '../ensureUsernameOrEmail.js'

export type Arguments<TSlug extends CollectionSlug> = {
  collection: Collection
  data: AuthOperationsFromCollectionSlug<TSlug>['registerFirstUser'] &
    RequiredDataFromCollectionSlug<TSlug>
  req: PayloadRequest
}

export type Result<TData> = {
  exp?: number
  token?: string
  user?: TData
}

export const registerFirstUserOperation = async <TSlug extends CollectionSlug>(
  args: Arguments<TSlug>,
): Promise<Result<DataFromCollectionSlug<TSlug>>> => {
  const {
    collection: {
      config,
      config: {
        slug,
        auth: { verify },
      },
    },
    data,
    req,
    req: { payload },
  } = args

  if (config.auth.disableLocalStrategy) {
    throw new Forbidden(req.t)
  }

  try {
    const shouldCommit = await initTransaction(req)

    ensureUsernameOrEmail<TSlug>({
      authOptions: config.auth,
      collectionSlug: slug,
      data,
      operation: 'create',
      req,
    })

    const doc = await payload.db.findOne({
      collection: config.slug,
      req,
    })

    if (doc) {
      throw new Forbidden(req.t)
    }

    // /////////////////////////////////////
    // Register first user
    // /////////////////////////////////////

    const result = await payload.create<TSlug, SelectType>({
      collection: slug as TSlug,
      data,
      overrideAccess: true,
      req,
    })

    // auto-verify (if applicable)
    if (verify) {
      await payload.update({
        id: result.id,
        collection: slug,
        data: {
          _verified: true,
        },
        req,
      })
    }

    // /////////////////////////////////////
    // Log in new user
    // /////////////////////////////////////

    const { exp, token } = await payload.login({
      ...args,
      collection: slug,
      req,
    })

    result.collection = slug
    result._strategy = 'local-jwt'

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return {
      exp,
      token,
      user: result,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
