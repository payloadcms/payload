import crypto from 'crypto'
import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
} from '../../collections/config/types.js'
import type { AuthCollectionSlug, Payload, RequestContext } from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError } from '../../errors/index.js'
import { Forbidden } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import { authIdentifierSchema, collectionSchema } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { getRequestOrigin } from '../../utilities/getRequestOrigin.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLoginOptions } from '../getLoginOptions.js'

export type ForgotPasswordArgs<TSlug extends AuthCollectionSlug> = {
  collection: Collection
  data: {
    [key: string]: unknown
  } & AuthOperationsFromCollectionSlug<TSlug>['forgotPassword']
  disableEmail?: boolean
  expiration?: number
  overrideAccess?: boolean
  req: PayloadRequest
}

export type Result = string

export const sendForgotPasswordEmail = async <TSlug extends AuthCollectionSlug>(
  incomingArgs: ForgotPasswordArgs<TSlug>,
): Promise<null | string> => {
  const loginWithUsername = incomingArgs.collection.config.auth.loginWithUsername
  const { data, overrideAccess } = incomingArgs

  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername)

  const sanitizedEmail =
    (canLoginWithEmail && (incomingArgs.data.email || '').toLowerCase().trim()) || null
  const sanitizedUsername =
    'username' in data && typeof data?.username === 'string'
      ? data.username.toLowerCase().trim()
      : null

  let args = incomingArgs

  if (incomingArgs.collection.config.auth.disableLocalStrategy) {
    throw new Forbidden(incomingArgs.req.t)
  }
  if (!sanitizedEmail && !sanitizedUsername) {
    throw new APIError(
      `Missing ${loginWithUsername ? 'username' : 'email'}.`,
      httpStatus.BAD_REQUEST,
    )
  }

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////
    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'forgotPassword',
      overrideAccess,
    })

    const {
      collection: { config: collectionConfig },
      disableEmail,
      expiration,
      req: {
        payload: { config, email },
        payload,
      },
      req,
    } = args

    // /////////////////////////////////////
    // Forget password
    // /////////////////////////////////////

    let token: string = crypto.randomBytes(20).toString('hex')
    type UserDoc = {
      email?: string
      id: number | string
      resetPasswordExpiration?: string
      resetPasswordToken?: string
    }

    if (!sanitizedEmail && !sanitizedUsername) {
      throw new APIError(
        `Missing ${loginWithUsername ? 'username' : 'email'}.`,
        httpStatus.BAD_REQUEST,
      )
    }

    let whereConstraint: Where = {}

    if (canLoginWithEmail && sanitizedEmail) {
      whereConstraint = {
        email: {
          equals: sanitizedEmail,
        },
      }
    } else if (canLoginWithUsername && sanitizedUsername) {
      whereConstraint = {
        username: {
          equals: sanitizedUsername,
        },
      }
    }

    // Exclude trashed users unless `trash: true`
    whereConstraint = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash: false,
      where: whereConstraint,
    })

    let user = await payload.db.findOne<UserDoc>({
      collection: collectionConfig.slug,
      req,
      where: whereConstraint,
    })

    // We don't want to indicate specifically that an email was not found,
    // as doing so could lead to the exposure of registered emails.
    // Therefore, we prefer to fail silently.
    if (!user) {
      await commitTransaction(args.req)
      return null
    }

    const resetPasswordExpiration = new Date(
      Date.now() + (collectionConfig.auth?.forgotPassword?.expiration ?? expiration ?? 3600000),
    ).toISOString()

    user = await payload.update({
      id: user.id,
      collection: collectionConfig.slug,
      data: {
        resetPasswordExpiration,
        resetPasswordToken: token,
      },
      req,
    })

    if (!disableEmail && user.email) {
      const serverURL = getRequestOrigin({ config, req })
      const forgotURL = formatAdminURL({
        adminRoute: config.routes.admin,
        path: `${config.admin.routes.reset}/${token}`,
        serverURL,
      })
      let html = `${req.t('authentication:youAreReceivingResetPassword')}
    <a href="${forgotURL}">${forgotURL}</a>
    ${req.t('authentication:youDidNotRequestPassword')}`

      if (typeof collectionConfig.auth.forgotPassword?.generateEmailHTML === 'function') {
        html = await collectionConfig.auth.forgotPassword.generateEmailHTML({
          req,
          token,
          user,
        })
      }

      let subject = req.t('authentication:resetYourPassword')

      if (typeof collectionConfig.auth.forgotPassword?.generateEmailSubject === 'function') {
        subject = await collectionConfig.auth.forgotPassword.generateEmailSubject({
          req,
          token,
          user,
        })
      }

      await email.sendEmail({
        from: `"${email.defaultFromName}" <${email.defaultFromAddress}>`,
        html,
        subject,
        to: user.email,
      })
    }

    // /////////////////////////////////////
    // afterForgotPassword - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterForgotPassword?.length) {
      for (const hook of collectionConfig.hooks.afterForgotPassword) {
        await hook({ args, collection: args.collection?.config, context: req.context })
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    token = await buildAfterOperation({
      args,
      collection: args.collection?.config,
      operation: 'forgotPassword',
      overrideAccess,
      result: token,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return token
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

type ForgotPasswordLocalMethod = <TSlug extends AuthCollectionSlug>(
  options: LocalAPIOptions<ForgotPasswordOptions<TSlug>>,
) => Promise<Result>

const forgotPasswordSchema = z.looseObject({
  collection: collectionSchema,
  data: z.looseObject(authIdentifierSchema),
  disableEmail: z.boolean().optional().default(false),
  expiration: z.number().positive().optional(),
})

export const forgotPasswordLocalAPI = defineLocalAPI<ForgotPasswordLocalMethod>()({
  name: 'forgotPassword',
})

export const forgotPassword = defineOperation({
  action: 'forgotPassword',
  expose: {
    local: forgotPasswordLocalAPI,
    mcp: { name: 'forgotPassword' },
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const collection = getRequestCollection(req)
          const authData = collection.config.auth?.loginWithUsername
            ? {
                email: typeof req.data?.email === 'string' ? req.data.email : '',
                username: typeof req.data?.username === 'string' ? req.data.username : '',
              }
            : { email: typeof req.data?.email === 'string' ? req.data.email : '' }

          await invoke({
            context: req.payload,
            input: {
              collection: collection.config.slug,
              data: authData,
              overrideAccess: false,
              req,
            },
            validate: false,
          })

          return Response.json(
            { message: req.t('general:success') },
            {
              headers: headersWithCors({ headers: new Headers(), req }),
              status: httpStatus.OK,
            },
          )
        },
        method: 'post',
        path: '/forgot-password',
      },
    ],
  },
  handler: forgotPasswordHandler,
  input: forgotPasswordSchema,
  target: 'auth',
})

export type ForgotPasswordOptions<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: AuthOperationsFromCollectionSlug<TSlug>['forgotPassword']
  disableEmail?: boolean
  expiration?: number
  overrideAccess?: boolean
  req?: Partial<PayloadRequest>
}

async function forgotPasswordHandler<T extends AuthCollectionSlug>(
  payload: Payload,
  options: ForgotPasswordOptions<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    disableEmail,
    expiration,
    overrideAccess = true,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Forgot Password Operation.`,
    )
  }

  return sendForgotPasswordEmail({
    collection,
    data,
    disableEmail,
    expiration,
    overrideAccess,
    req: await createLocalReq(options, payload),
  }) as Promise<Result>
}
