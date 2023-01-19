import { Payload } from '../payload';
import { PayloadRequest } from '../express/types';
import { SanitizedConfig, EmailOptions } from '../config/types';
import { Collection } from '../collections/config/types';
import { User, VerifyConfig } from './types';


type Args = {
  config: SanitizedConfig,
  collection: Collection,
  user: User
  disableEmail: boolean
  req: PayloadRequest
  token: string
  sendEmail: Payload['sendEmail']
  emailOptions: EmailOptions
}

async function sendVerificationEmail(args: Args): Promise<void> {
  // Verify token from e-mail
  const {
    config,
    emailOptions,
    sendEmail,
    collection: {
      config: collectionConfig,
    },
    user,
    disableEmail,
    req,
    token,
  } = args;

  if (!disableEmail) {
    const verificationURL = `${config.serverURL}${config.routes.admin}/${collectionConfig.slug}/verify/${token}`;

    let html = `${req.t('authentication:newAccountCreated', { interpolation: { escapeValue: false }, serverURL: config.serverURL, verificationURL })}`;

    const verify = collectionConfig.auth.verify as VerifyConfig;

    // Allow config to override email content
    if (typeof verify.generateEmailHTML === 'function') {
      html = await verify.generateEmailHTML({
        req,
        token,
        user,
      });
    }

    let subject = req.t('authentication:verifyYourEmail');

    // Allow config to override email subject
    if (typeof verify.generateEmailSubject === 'function') {
      subject = await verify.generateEmailSubject({
        req,
        token,
        user,
      });
    }

    sendEmail({
      from: `"${emailOptions.fromName}" <${emailOptions.fromAddress}>`,
      to: user.email,
      subject,
      html,
    });
  }
}

export default sendVerificationEmail;
