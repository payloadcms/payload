import crypto from 'crypto';
import { APIError } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../../collections/config/types';

export type Arguments = {
  collection: Collection
  data: {
    email: string
    [key: string]: unknown
  }
  disableEmail?: boolean
  expiration?: number
  req: PayloadRequest
}

export type Result = string;

async function forgotPassword(incomingArgs: Arguments): Promise<string | null> {
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
      config: collectionConfig,
    },
    data,
    disableEmail,
    expiration,
    req: {
      t,
      payload,
      payload: {
        config,
        sendEmail: email,
        emailOptions,
      },
    },
    req,
  } = args;

  // /////////////////////////////////////
  // Forget password
  // /////////////////////////////////////

  let token: string | Buffer = crypto.randomBytes(20);
  token = token.toString('hex');

  type UserDoc = {
    id: string | number
    resetPasswordToken?: string,
    resetPasswordExpiration?: Date,
  }

  const { docs } = await payload.db.find<UserDoc>({
    collection: collectionConfig.slug,
    where: { email: { equals: (data.email as string).toLowerCase() } },
    limit: 1,
  });


  let [user] = docs;

  if (!user) return null;


  user.resetPasswordToken = token;
  user.resetPasswordExpiration = new Date(expiration || Date.now() + 3600000); // 1 hour

  user = await payload.update({
    collection: collectionConfig.slug,
    id: user.id,
    data: user,
  });

  if (!disableEmail) {
    let html = `${t('authentication:youAreReceivingResetPassword')}
    <a href="${config.serverURL}${config.routes.admin}/reset/${token}">
     ${config.serverURL}${config.routes.admin}/reset/${token}
    </a>
    ${t('authentication:youDidNotRequestPassword')}`;

    if (typeof collectionConfig.auth.forgotPassword.generateEmailHTML === 'function') {
      html = await collectionConfig.auth.forgotPassword.generateEmailHTML({
        req,
        token,
        user,
      });
    }

    let subject = t('authentication:resetYourPassword');

    if (typeof collectionConfig.auth.forgotPassword.generateEmailSubject === 'function') {
      subject = await collectionConfig.auth.forgotPassword.generateEmailSubject({
        req,
        token,
        user,
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
