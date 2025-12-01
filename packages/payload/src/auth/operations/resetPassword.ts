import { status as httpStatus } from 'http-status'

import type { Collection, DataFromCollectionSlug } from '../../collections/config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError, Forbidden } from '../../errors/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'
import { addSessionToUser } from '../sessions.js'
import { authenticateLocalStrategy } from '../strategies/local/authenticate.js'
import { generatePasswordSaltHash } from '../strategies/local/generatePasswordSaltHash.js'

export type Result = {
  token?: string
  user: Record<string, unknown>
}

export type Arguments = {
  collection: Collection
  data: {
    password: string
    token: string
  }
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
}

export const resetPasswordOperation = async <TSlug extends CollectionSlug>(
  args: Arguments,
): Promise<Result> => {
  const {
    collection: { config: collectionConfig },
    data,
    depth,
    overrideAccess,
    req: {
      payload: { secret },
      payload,
    },
    req,
  } = args

  if (
    !Object.prototype.hasOwnProperty.call(data, 'token') ||
    !Object.prototype.hasOwnProperty.call(data, 'password')
  ) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST)
  }

  if (collectionConfig.auth.disableLocalStrategy) {
    throw new Forbidden(req.t)
  }

  try {
    const shouldCommit = await initTransaction(req)

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'resetPassword',
    })

    // /////////////////////////////////////
    // Reset Password
    // /////////////////////////////////////

    const where = appendNonTrashedFilter({
      enableTrash: Boolean(collectionConfig.trash),
      trash: false,
      where: {
        resetPasswordExpiration: { greater_than: new Date().toISOString() },
        resetPasswordToken: { equals: data.token },
      },
    })

    const user = await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where,
    })

    if (!user) {
      throw new APIError('Token is either invalid or has expired.', httpStatus.FORBIDDEN)
    }

    // TODO: replace this method
    const { hash, salt } = await generatePasswordSaltHash({
      collection: collectionConfig,
      password: data.password,
      req,
    })

    user.salt = salt
    user.hash = hash

    user.resetPasswordExpiration = new Date().toISOString()

    if (collectionConfig.auth.verify) {
      user._verified = Boolean(user._verified)
    }
    // /////////////////////////////////////
    // beforeValidate - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeValidate?.length) {
      for (const hook of collectionConfig.hooks.beforeValidate) {
        await hook({
          collection: args.collection?.config,
          context: req.context,
          data: user,
          operation: 'update',
          req,
        })
      }
    }

    // /////////////////////////////////////
    // Update new password
    // /////////////////////////////////////

    // Ensure updatedAt date is always updated
    user.updatedAt = new Date().toISOString()

    const doc = await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
    })

    await authenticateLocalStrategy({ doc, password: data.password })

    const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
      collectionConfig,
      email: user.email,
      user,
    }

    const { sid } = await addSessionToUser({
      collectionConfig,
      payload,
      req,
      user,
    })

    if (sid) {
      fieldsToSignArgs.sid = sid
    }

    const fieldsToSign = getFieldsToSign(fieldsToSignArgs)

    // /////////////////////////////////////
    // beforeLogin - Collection
    // /////////////////////////////////////

    let userBeforeLogin = user

    if (collectionConfig.hooks?.beforeLogin?.length) {
      for (const hook of collectionConfig.hooks.beforeLogin) {
        userBeforeLogin =
          (await hook({
            collection: args.collection?.config,
            context: args.req.context,
            req: args.req,
            user: userBeforeLogin,
          })) || userBeforeLogin
      }
    }

    const { token } = await jwtSign({
      fieldsToSign,
      secret,
      tokenExpiration: collectionConfig.auth.tokenExpiration,
    })

    req.user = userBeforeLogin

    // /////////////////////////////////////
    // afterLogin - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterLogin?.length) {
      for (const hook of collectionConfig.hooks.afterLogin) {
        userBeforeLogin =
          (await hook({
            collection: args.collection?.config,
            context: args.req.context,
            req: args.req,
            token,
            user: userBeforeLogin,
          })) || userBeforeLogin
      }
    }

    const fullUser = await payload.findByID({
      id: user.id,
      collection: collectionConfig.slug,
      depth,
      overrideAccess,
      req,
      trash: false,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    if (fullUser) {
      fullUser.collection = collectionConfig.slug
      fullUser._strategy = 'local-jwt'
    }

    let result: { user: DataFromCollectionSlug<TSlug> } & Result = {
      token,
      user: fullUser,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: args.collection?.config,
      operation: 'resetPassword',
      result,
    })

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
