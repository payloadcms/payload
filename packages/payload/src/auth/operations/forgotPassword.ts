import crypto from 'crypto';
import { APIError } from '../../errors.js';
import { PayloadRequest } from '../../express/types.js';
import { Collection } from '../../collections/config/types.js';
import { buildAfterOperation } from '../../collections/operations/utils.js';

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
      context: args.req.context,
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

  if (!data.email) {
    throw new APIError('Missing email.');
  }

  let user = await payload.db.findOne<UserDoc>({
    collection: collectionConfig.slug,
    where: { email: { equals: (data.email as string).toLowerCase() } },
  });


  if (!user) return null;

  user.resetPasswordToken = token;
  user.resetPasswordExpiration = new Date(expiration || Date.now() + 3600000); // 1 hour

  user = await payload.update({
    collection: collectionConfig.slug,
    id: user.id,
    data: user,
  });

  if (!disableEmail) {
    const serverURL = (config.serverURL !== null && config.serverURL !== '') ? config.serverURL : `${req.protocol}://${req.get('host')}`;

    let html = `${t('authentication:youAreReceivingResetPassword')}
    <a href="${serverURL}${config.routes.admin}/reset/${token}">
     ${serverURL}${config.routes.admin}/reset/${token}
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
    await hook({ args, context: req.context });
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterOperation - Collection
  // /////////////////////////////////////

  token = await buildAfterOperation({
    operation: 'forgotPassword',
    args,
    result: token,
  });

  return token;
}

export default forgotPassword;
