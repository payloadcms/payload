import { status as httpStatus } from 'http-status'

import type { Collection, DataFromCollectionSlug } from '../../collections/config/types.js'
import type { AuthCollectionSlug, TypedUser } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError, Forbidden } from '../../errors/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { applyUserReadAccess } from '../applyUserReadAccess.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'
import { addSessionToUser, revokeSession } from '../sessions.js'
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

export const resetPasswordOperation = async <TSlug extends AuthCollectionSlug>(
  args: Arguments,
): Promise<Result> => {
  const {
    collection: { config: collectionConfig },
    data,
    depth,
    overrideAccess = false,
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

  let sid: string | undefined
  let sessionUser: null | TypedUser = null

  try {
    const shouldCommit = await initTransaction(req)

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'resetPassword',
      overrideAccess,
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

    let user = await payload.db.findOne<TypedUser>({
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

    if (collectionConfig.auth.maxLoginAttempts > 0) {
      user.lockUntil = null
      user.loginAttempts = 0
    }

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

    if (collectionConfig.auth.useSessions) {
      user.sessions = []
    }

    const doc = await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
    })

    await authenticateLocalStrategy({ doc, password: data.password })

    user = doc as TypedUser
    user.collection = collectionConfig.slug
    user._strategy = 'local-jwt'

    const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
      collectionConfig,
      email: user.email!,
      user,
    }

    const session = await addSessionToUser({
      collectionConfig,
      payload,
      req,
      user,
    })

    sessionUser = user
    sid = session.sid

    if (sid) {
      fieldsToSignArgs.sid = sid
    }

    const fieldsToSign = getFieldsToSign(fieldsToSignArgs)

    // /////////////////////////////////////
    // beforeLogin - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeLogin?.length) {
      for (const hook of collectionConfig.hooks.beforeLogin) {
        user = ((await hook({
          collection: args.collection?.config,
          context: args.req.context,
          req: args.req,
          user,
        })) || user) as NonNullable<TypedUser>
      }
    }

    const { token } = await jwtSign({
      fieldsToSign,
      secret,
      tokenExpiration: collectionConfig.auth.tokenExpiration,
    })

    req.user = user

    // /////////////////////////////////////
    // afterLogin - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterLogin?.length) {
      for (const hook of collectionConfig.hooks.afterLogin) {
        user = ((await hook({
          collection: args.collection?.config,
          context: args.req.context,
          req: args.req,
          token,
          user,
        })) || user) as NonNullable<TypedUser>
      }
    }

    user.collection = collectionConfig.slug
    user._strategy = 'local-jwt'

    const userWithReadAccess = await applyUserReadAccess({
      collection: collectionConfig,
      depth: depth!,
      overrideAccess,
      req,
      showHiddenFields: false,
      user,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    let result: { user: DataFromCollectionSlug<TSlug> } & Result = {
      token,
      user: userWithReadAccess,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: args.collection?.config,
      operation: 'resetPassword',
      overrideAccess,
      result,
    })

    return result
  } catch (error: unknown) {
    if (sid) {
      await revokeSession({
        collectionConfig,
        payload,
        req,
        sid,
        user: sessionUser,
      })
    }
    await killTransaction(req)
    throw error
  }
}
