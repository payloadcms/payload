import crypto from 'crypto';
import { Document } from 'mongoose';
import { APIError } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../../collections/config/types';

export type Arguments = {
  collection: Collection
  data: {
    [key: string]: unknown
  }
  disableEmail?: boolean
  expiration?: number
  req: PayloadRequest
}

export type Result = string;

async function forgotPassword(incomingArgs: Arguments): Promise<string | null> {
  const { config, sendEmail: email, emailOptions } = this;

  if (!Object.prototype.hasOwnProperty.call(incomingArgs.data, 'email')) {
    throw new APIError('Missing email.', 400);
  }

  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'forgotPassword',
    })) || args;
  }, Promise.resolve());

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    data,
    disableEmail,
    expiration,
    req,
  } = args;

  // /////////////////////////////////////
  // Forget password
  // /////////////////////////////////////

  let token: string | Buffer = crypto.randomBytes(20);
  token = token.toString('hex');

  type UserDoc = Document & {
    resetPasswordToken?: string,
    resetPasswordExpiration?: number | Date,
  }
  const user: UserDoc = await Model.findOne({ email: (data.email as string).toLowerCase() });

  if (!user) return null;

  user.resetPasswordToken = token;
  user.resetPasswordExpiration = expiration || Date.now() + 3600000; // 1 hour

  await user.save();

  const userJSON = user.toJSON({ virtuals: true });

  if (!disableEmail) {
    let html = `You are receiving this because you (or someone else) have requested the reset of the password for your account.
    Please click on the following link, or paste this into your browser to complete the process:
    <a href="${config.serverURL}${config.routes.admin}/reset/${token}">
     ${config.serverURL}${config.routes.admin}/reset/${token}
    </a>
    If you did not request this, please ignore this email and your password will remain unchanged.`;

    if (typeof collectionConfig.auth.forgotPassword.generateEmailHTML === 'function') {
      html = await collectionConfig.auth.forgotPassword.generateEmailHTML({
        req,
        token,
        user: userJSON,
      });
    }

    let subject = 'Reset your password';

    if (typeof collectionConfig.auth.forgotPassword.generateEmailSubject === 'function') {
      subject = await collectionConfig.auth.forgotPassword.generateEmailSubject({
        req,
        token,
        user: userJSON,
      });
    }

    email({
      from: `"${emailOptions.fromName}" <${emailOptions.fromAddress}>`,
      to: data.email,
      subject,
      html,
    });
  }

  // /////////////////////////////////////
  // afterForgotPassword - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterForgotPassword.reduce(async (priorHook, hook) => {
    await priorHook;
    await hook({ args });
  }, Promise.resolve());

  return token;
}

export default forgotPassword;
