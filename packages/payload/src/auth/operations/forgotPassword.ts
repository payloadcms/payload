import crypto from 'crypto'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'

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

async function forgotPassword(incomingArgs: Arguments): Promise<null | string> {
  if (!Object.prototype.hasOwnProperty.call(incomingArgs.data, 'email')) {
    throw new APIError('Missing email.', 400)
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
      resetPasswordExpiration?: string
      resetPasswordToken?: string
    }

    if (!data.email) {
      throw new APIError('Missing email.')
    }

    const userDbArgs = {
      collection: collectionConfig.slug,
      req,
      where: { email: { equals: data.email.toLowerCase() } },
    }

    let user: UserDoc
    if (collectionConfig?.db?.findOne) {
      user = await collectionConfig.db.findOne<UserDoc>(userDbArgs)
    } else {
      user = await payload.db.findOne<UserDoc>(userDbArgs)
    }

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
    await killTransaction(args.req)
    throw error
  }
}

export default forgotPassword
