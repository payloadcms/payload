import { Payload } from '..';
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
    const defaultVerificationURL = `${config.serverURL}${config.routes.admin}/${collectionConfig.slug}/verify/${token}`;

    let html = `A new account has just been created for you to access <a href="${config.serverURL}">${config.serverURL}</a>.
    Please click on the following link or paste the URL below into your browser to verify your email:
    <a href="${defaultVerificationURL}">${defaultVerificationURL}</a><br>
    After verifying your email, you will be able to log in successfully.`;

    const verify = collectionConfig.auth.verify as VerifyConfig;

    // Allow config to override email content
    if (typeof verify.generateEmailHTML === 'function') {
      html = await verify.generateEmailHTML({
        req,
        token,
        user,
      });
    }

    let subject = 'Verify your email';

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
