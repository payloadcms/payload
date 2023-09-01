import crypto from 'crypto'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'

import { buildAfterOperation } from '../../collections/operations/utils'
import { APIError } from '../../errors'

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

async function forgotPassword(incomingArgs: Arguments): Promise<null | string> {
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
      t,
    },
    req,
  } = args

  // /////////////////////////////////////
  // Forget password
  // /////////////////////////////////////

  let token: Buffer | string = crypto.randomBytes(20)
  token = token.toString('hex')

  type UserDoc = {
    id: number | string
    resetPasswordExpiration?: Date
    resetPasswordToken?: string
  }

  if (!data.email) {
    throw new APIError('Missing email.')
  }

  let user = await payload.db.findOne<UserDoc>({
    collection: collectionConfig.slug,
    where: { email: { equals: data.email.toLowerCase() } },
  })

  if (!user) return null

  user.resetPasswordToken = token
  user.resetPasswordExpiration = new Date(expiration || Date.now() + 3600000) // 1 hour

  user = await payload.update({
    collection: collectionConfig.slug,
    data: user,
    id: user.id,
  })

  if (!disableEmail) {
    const serverURL =
      config.serverURL !== null && config.serverURL !== ''
        ? config.serverURL
        : `${req.protocol}://${req.get('host')}`

    let html = `${t('authentication:youAreReceivingResetPassword')}
    <a href="${serverURL}${config.routes.admin}/reset/${token}">
     ${serverURL}${config.routes.admin}/reset/${token}
    </a>
    ${t('authentication:youDidNotRequestPassword')}`

    if (typeof collectionConfig.auth.forgotPassword.generateEmailHTML === 'function') {
      html = await collectionConfig.auth.forgotPassword.generateEmailHTML({
        req,
        token,
        user,
      })
    }

    let subject = t('authentication:resetYourPassword')

    if (typeof collectionConfig.auth.forgotPassword.generateEmailSubject === 'function') {
      subject = await collectionConfig.auth.forgotPassword.generateEmailSubject({
        req,
        token,
        user,
      })
    }

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
    await hook({ args, context: req.context })
  }, Promise.resolve())

  // /////////////////////////////////////
  // afterOperation - Collection
  // /////////////////////////////////////

  token = await buildAfterOperation({
    args,
    operation: 'forgotPassword',
    result: token,
  })

  return token
}

export default forgotPassword
