import crypto from 'crypto'
import httpStatus from 'http-status'
import { URL } from 'url'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequestWithData } from '../../types/index.js'

import { buildAfterOperation } from '../../collections/operations/utils.js'
import { APIError } from '../../errors/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'

export type Arguments = {
  collection: Collection
  data: {
    [key: string]: unknown
    email: string
  }
  disableEmail?: boolean
  expiration?: number
  req: PayloadRequestWithData
}

export type Result = string

export const forgotPasswordOperation = async (incomingArgs: Arguments): Promise<null | string> => {
  if (!Object.prototype.hasOwnProperty.call(incomingArgs.data, 'email')) {
    throw new APIError('Missing email.', httpStatus.BAD_REQUEST)
  }

  let args = incomingArgs

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
      await priorHook

      args =
        (await hook({
          args,
          collection: args.collection?.config,
          context: args.req.context,
          operation: 'forgotPassword',
          req: args.req,
        })) || args
    }, Promise.resolve())

    const {
      collection: { config: collectionConfig },
      data,
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
      id: number | string
      resetPasswordExpiration?: string
      resetPasswordToken?: string
    }

    if (!data.email) {
      throw new APIError('Missing email.', httpStatus.BAD_REQUEST)
    }

    let user = await payload.db.findOne<UserDoc>({
      collection: collectionConfig.slug,
      req,
      where: { email: { equals: data.email.toLowerCase() } },
    })

    // We don't want to indicate specifically that an email was not found,
    // as doing so could lead to the exposure of registered emails.
    // Therefore, we prefer to fail silently.
    if (!user) return null

    user.resetPasswordToken = token
    user.resetPasswordExpiration = new Date(expiration || Date.now() + 3600000).toISOString() // 1 hour

    user = await payload.update({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
    })

    if (!disableEmail) {
      const protocol = new URL(req.url).protocol // includes the final :
      const serverURL =
        config.serverURL !== null && config.serverURL !== ''
          ? config.serverURL
          : `${protocol}//${req.headers.get('host')}`

      let html = `${req.t('authentication:youAreReceivingResetPassword')}
    <a href="${serverURL}${config.routes.admin}/reset/${token}">${serverURL}${config.routes.admin}/reset/${token}</a>
    ${req.t('authentication:youDidNotRequestPassword')}`

      if (typeof collectionConfig.auth.forgotPassword.generateEmailHTML === 'function') {
        html = await collectionConfig.auth.forgotPassword.generateEmailHTML({
          req,
          token,
          user,
        })
      }

      let subject = req.t('authentication:resetYourPassword')

      if (typeof collectionConfig.auth.forgotPassword.generateEmailSubject === 'function') {
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
        to: data.email,
      })
    }

    // /////////////////////////////////////
    // afterForgotPassword - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterForgotPassword.reduce(async (priorHook, hook) => {
      await priorHook
      await hook({ args, collection: args.collection?.config, context: req.context })
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    token = await buildAfterOperation({
      args,
      collection: args.collection?.config,
      operation: 'forgotPassword',
      result: token,
    })

    if (shouldCommit) await commitTransaction(req)

    return token
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
