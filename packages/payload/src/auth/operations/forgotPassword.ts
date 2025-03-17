// @ts-strict-ignore
import crypto from 'crypto'
import { status as httpStatus } from 'http-status'
import { URL } from 'url'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
} from '../../collections/config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utils.js'
import { APIError } from '../../errors/index.js'
import { Forbidden } from '../../index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLoginOptions } from '../getLoginOptions.js'

export type Arguments<TSlug extends CollectionSlug> = {
  collection: Collection
  data: {
    [key: string]: unknown
  } & AuthOperationsFromCollectionSlug<TSlug>['forgotPassword']
  disableEmail?: boolean
  expiration?: number
  req: PayloadRequest
}

export type Result = string

export const forgotPasswordOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments<TSlug>,
): Promise<null | string> => {
  const loginWithUsername = incomingArgs.collection.config.auth.loginWithUsername
  const { data } = incomingArgs

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

    if (args.collection.config.hooks?.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection?.config,
            context: args.req.context,
            operation: 'forgotPassword',
            req: args.req,
          })) || args
      }
    }

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

    user.resetPasswordToken = token
    user.resetPasswordExpiration = new Date(
      Date.now() + (collectionConfig.auth?.forgotPassword?.expiration ?? expiration ?? 3600000),
    ).toISOString()

    user = await payload.update({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
    })

    if (!disableEmail && user.email) {
      const protocol = new URL(req.url).protocol // includes the final :
      const serverURL =
        config.serverURL !== null && config.serverURL !== ''
          ? config.serverURL
          : `${protocol}//${req.headers.get('host')}`
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
