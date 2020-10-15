const crypto = require('crypto');
const { APIError } = require('../../errors');

async function forgotPassword(args) {
  const { config, sendEmail: email } = this;

  if (!Object.prototype.hasOwnProperty.call(args.data, 'email')) {
    throw new APIError('Missing email.');
  }

  let options = { ...args };

  // /////////////////////////////////////
  // 1. Execute before forgotPassword hook
  // /////////////////////////////////////

  const { beforeForgotPassword } = args.collection.config.hooks;

  if (typeof beforeForgotPassword === 'function') {
    options = await beforeForgotPassword(options);
  }

  // /////////////////////////////////////
  // 2. Perform forgot password
  // /////////////////////////////////////

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    data,
    disableEmail,
    expiration,
    req,
  } = options;

  let token = crypto.randomBytes(20);
  token = token.toString('hex');

  const user = await Model.findOne({ email: data.email.toLowerCase() });

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
      html = collectionConfig.auth.forgotPassword.generateEmailHTML({
        req,
        token,
        user: userJSON,
      });
    }

    let subject = 'Reset your password';

    if (typeof collectionConfig.auth.forgotPassword.generateEmailSubject === 'function') {
      subject = collectionConfig.auth.forgotPassword.generateEmailSubject({
        req,
        token,
        user: userJSON,
      });
    }

    email({
      from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
      to: data.email,
      subject,
      html,
    });
  }

  // /////////////////////////////////////
  // 3. Execute after forgotPassword hook
  // /////////////////////////////////////

  const { afterForgotPassword } = args.collection.config.hooks;

  if (typeof afterForgotPassword === 'function') {
    await afterForgotPassword(options);
  }

  return token;
}

module.exports = forgotPassword;
