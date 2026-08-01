import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type { Collection, DataFromCollectionSlug } from '../../collections/config/types.js'
import type { AuthCollectionSlug, Payload, RequestContext, User } from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError, Forbidden } from '../../errors/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { collectionSchema, depthSchema } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { generatePayloadCookie } from '../cookies.js'
import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'
import { addSessionToUser, revokeSession } from '../sessions.js'
import { authenticateLocalStrategy } from '../strategies/local/authenticate.js'
import { generatePasswordSaltHash } from '../strategies/local/generatePasswordSaltHash.js'

export type Result = {
  token?: string
  user: Record<string, unknown>
}

type ResetPasswordLocalMethod = <TSlug extends AuthCollectionSlug>(
  options: LocalAPIOptions<ResetPasswordOptions<TSlug>>,
) => Promise<Result>

const resetPasswordSchema = z.looseObject({
  collection: collectionSchema,
  data: z.object({
    password: z.string(),
    token: z.string(),
  }),
  depth: depthSchema,
})

export const resetPasswordLocalAPI = defineLocalAPI<ResetPasswordLocalMethod>()({
  name: 'resetPassword',
  afterHandler: ({
    context: payload,
    input,
    result,
  }: {
    context: { collections: Record<string, Collection> }
    input: { collection: string }
    result: Result
  }) => {
    if (payload.collections[input.collection]?.config.auth.removeTokenFromResponses) {
      delete result.token
    }

    return result
  },
})

export const resetPassword = defineOperation({
  action: 'resetPassword',
  expose: {
    local: resetPasswordLocalAPI,
    mcp: { name: 'resetPassword' },
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const collection = getRequestCollection(req)
          const depth = req.searchParams.get('depth')
          const result = await invoke({
            context: req.payload,
            input: {
              collection: collection.config.slug,
              data: {
                password: typeof req.data?.password === 'string' ? req.data.password : '',
                token: typeof req.data?.token === 'string' ? req.data.token : '',
              },
              depth: depth ? Number(depth) : undefined,
              overrideAccess: false,
              req,
            },
            validate: false,
          })
          const cookie = generatePayloadCookie({
            collectionAuthConfig: collection.config.auth,
            cookiePrefix: req.payload.config.cookiePrefix,
            token: result.token!,
          })

          if (collection.config.auth.removeTokenFromResponses) {
            delete result.token
          }

          return Response.json(
            { message: req.t('authentication:passwordResetSuccessfully'), ...result },
            {
              headers: headersWithCors({
                headers: new Headers({ 'Set-Cookie': cookie }),
                req,
              }),
              status: httpStatus.OK,
            },
          )
        },
        method: 'post',
        path: '/reset-password',
      },
    ],
  },
  handler: resetPasswordHandler,
  input: resetPasswordSchema,
  target: 'auth',
})

export type ResetPasswordArgs = {
  collection: Collection
  data: {
    password: string
    token: string
  }
  depth?: number
  overrideAccess?: boolean
  req: PayloadRequest
}

export const resetUserPassword = async <TSlug extends AuthCollectionSlug>(
  args: ResetPasswordArgs,
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

  let sid: string | undefined
  let user: null | User = null

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

    user = await payload.db.findOne<User>({
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
      email: user.email!,
      user,
    }

    const session = await addSessionToUser({
      collectionConfig,
      payload,
      req,
      user,
    })
    sid = session.sid

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
        user,
      })
    }
    await killTransaction(req)
    throw error
  }
}

export type ResetPasswordOptions<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: {
    password: string
    token: string
  }
  depth?: number
  overrideAccess: boolean
  req?: Partial<PayloadRequest>
}

async function resetPasswordHandler<TSlug extends AuthCollectionSlug>(
  payload: Payload,
  options: ResetPasswordOptions<TSlug>,
): Promise<Result> {
  const { collection: collectionSlug, data, depth, overrideAccess } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Reset Password Operation.`,
    )
  }

  const result = await resetUserPassword<TSlug>({
    collection,
    data,
    depth,
    overrideAccess,
    req: await createLocalReq(options, payload),
  })

  return result
}
