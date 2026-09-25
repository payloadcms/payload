import crypto from 'crypto'
import { status as httpStatus } from 'http-status'

import type {
  AuthOperationsFromCollectionSlug,
  Collection,
} from '../../collections/config/types.js'
import type { AuthCollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js'
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js'
import { APIError } from '../../errors/index.js'
import { Forbidden } from '../../index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { assertNoValidationWrite } from '../../utilities/assertNoValidationWrite.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { getRequestOrigin } from '../../utilities/getRequestOrigin.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLoginOptions } from '../getLoginOptions.js'

export type Arguments<TSlug extends AuthCollectionSlug> = {
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

export const forgotPasswordOperation = async <TSlug extends AuthCollectionSlug>(
  incomingArgs: Arguments<TSlug>,
): Promise<null | string> => {
  assertNoValidationWrite(incomingArgs.req)

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
  let hasSentEmail = false
  let releaseRequestInterval: (() => Promise<void>) | null = null

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
    const minRequestInterval = collectionConfig.auth.forgotPassword.minRequestInterval ?? 15000

    // /////////////////////////////////////
    // Forget password
    // /////////////////////////////////////

    type UserDoc = {
      email?: string
      id: number | string
      resetPasswordExpiration?: string
      resetPasswordRequestedAt?: string
      resetPasswordToken?: string
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

    const now = Date.now()
    let token: string = crypto.randomBytes(20).toString('hex')
    const resetPasswordExpiration = new Date(
      now + (collectionConfig.auth?.forgotPassword?.expiration ?? expiration ?? 3600000),
    ).toISOString()
    let user: null | UserDoc

    if (!disableEmail && minRequestInterval > 0) {
      const requestedAt = new Date(now).toISOString()
      const reservationReq = isolateObjectProperty(req, 'transactionID')
      reservationReq.transactionID = undefined

      user = (await payload.db.updateOne({
        collection: collectionConfig.slug,
        data: {
          resetPasswordRequestedAt: requestedAt,
        },
        options: { atomic: true },
        req: reservationReq,
        where: {
          and: [
            whereConstraint,
            {
              or: [
                { resetPasswordRequestedAt: { exists: false } },
                { resetPasswordRequestedAt: { equals: null } },
                {
                  resetPasswordRequestedAt: {
                    less_than_equal: new Date(now - minRequestInterval).toISOString(),
                  },
                },
              ],
            },
          ],
        },
      })) as null | UserDoc

      if (user) {
        const userID = user.id
        releaseRequestInterval = async () => {
          await payload.db.updateOne({
            collection: collectionConfig.slug,
            data: { resetPasswordRequestedAt: null },
            options: { atomic: true },
            req: reservationReq,
            where: {
              and: [
                { id: { equals: userID } },
                { resetPasswordRequestedAt: { equals: requestedAt } },
              ],
            },
          })
        }
      }
    } else {
      user = await payload.db.findOne<UserDoc>({
        collection: collectionConfig.slug,
        req,
        where: whereConstraint,
      })
    }

    // We don't want to indicate specifically that an email was not found,
    // as doing so could lead to the exposure of registered emails.
    // Therefore, we prefer to fail silently.
    if (!user) {
      if (shouldCommit) {
        await commitTransaction(args.req)
      }
      return null
    }

    user = await payload.update({
      id: user.id,
      collection: collectionConfig.slug,
      data: {
        resetPasswordExpiration,
        resetPasswordToken: token,
      },
      overrideAccess: true,
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
      hasSentEmail = true
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

    if (!hasSentEmail && releaseRequestInterval) {
      try {
        await releaseRequestInterval()
      } catch (err) {
        args.req.payload.logger.error({ err, msg: 'Failed to release forgot-password interval' })
      }
    }

    throw error
  }
}
