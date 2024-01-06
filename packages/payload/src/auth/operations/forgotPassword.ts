import crypto from 'crypto'
import { URL } from 'url'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../types'

import { buildAfterOperation } from '../../collections/operations/utils'
import { APIError } from '../../errors'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'

export type Arguments = {
  collection: Collection
  data: {
    [key: string]: unknown
    email: string
  }
  disableEmail?: boolean
  expiration?: number
  req: PayloadRequest
}

export type Result = string

export const forgotPasswordOperation = async (incomingArgs: Arguments): Promise<null | string> => {
  if (!Object.prototype.hasOwnProperty.call(incomingArgs.data, 'email')) {
    throw new APIError('Missing email.', 400)
  }

  let args = incomingArgs

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
      })) || args
  }, Promise.resolve())

  const {
    collection: { config: collectionConfig },
    data,
    disableEmail,
    expiration,
    req: {
      payload: { config, emailOptions, sendEmail: email },
      payload,
    },
    req,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

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
      throw new APIError('Missing email.')
    }

    let user = await payload.db.findOne<UserDoc>({
      collection: collectionConfig.slug,
      req,
      where: { email: { equals: data.email.toLowerCase() } },
    })

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
      const protocol = new URL(req.url).protocol
      const serverURL =
        config.serverURL !== null && config.serverURL !== ''
          ? config.serverURL
          : `${protocol}://${req.headers.get('host')}`

      let html = `${req.t('authentication:youAreReceivingResetPassword')}
    <a href="${serverURL}${config.routes.admin}/reset/${token}">
     ${serverURL}${config.routes.admin}/reset/${token}
    </a>
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

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      email({
        from: `"${emailOptions.fromName}" <${emailOptions.fromAddress}>`,
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
    await killTransaction(req)
    throw error
  }
}
