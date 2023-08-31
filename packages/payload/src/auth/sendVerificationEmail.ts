import type { Collection } from '../collections/config/types.js'
import type { EmailOptions, SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../express/types.js'
import type { Payload } from '../payload.js'
import type { User, VerifyConfig } from './types.js'

type Args = {
  collection: Collection
  config: SanitizedConfig
  disableEmail: boolean
  emailOptions: EmailOptions
  req: PayloadRequest
  sendEmail: Payload['sendEmail']
  token: string
  user: User
}

export async function sendVerificationEmail(args: Args): Promise<void> {
  // Verify token from e-mail
  const {
    collection: { config: collectionConfig },
    config,
    disableEmail,
    emailOptions,
    req,
    sendEmail,
    token,
    user,
  } = args

  if (!disableEmail) {
    const serverURL =
      config.serverURL !== null && config.serverURL !== ''
        ? config.serverURL
        : `${req.protocol}://${req.get('host')}`

    const verificationURL = `${serverURL}${config.routes.admin}/${collectionConfig.slug}/verify/${token}`

    let html = `${req.t('authentication:newAccountCreated', {
      interpolation: { escapeValue: false },
      serverURL: config.serverURL,
      verificationURL,
    })}`

    const verify = collectionConfig.auth.verify as VerifyConfig

    // Allow config to override email content
    if (typeof verify.generateEmailHTML === 'function') {
      html = await verify.generateEmailHTML({
        req,
        token,
        user,
      })
    }

    let subject = req.t('authentication:verifyYourEmail')

    // Allow config to override email subject
    if (typeof verify.generateEmailSubject === 'function') {
      subject = await verify.generateEmailSubject({
        req,
        token,
        user,
      })
    }

    await sendEmail({
      from: `"${emailOptions.fromName}" <${emailOptions.fromAddress}>`,
      html,
      subject,
      to: user.email,
    })
  }
}
