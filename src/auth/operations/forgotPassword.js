const crypto = require('crypto');
const { APIError } = require('../../errors');

const forgotPassword = async (args) => {
  if (!Object.prototype.hasOwnProperty.call(args.data, 'email')) {
    throw new APIError('Missing email.');
  }

  let options = { ...args };

  // /////////////////////////////////////
  // 1. Execute before login hook
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
    },
    config,
    data,
    email,
  } = options;

  let token = await crypto.randomBytes(20);
  token = token.toString('hex');

  const user = await Model.findOne({ email: data.email });

  if (!user) return;

  user.resetPasswordToken = token;
  user.resetPasswordExpiration = Date.now() + 3600000; // 1 hour

  await user.save();

  const html = `You are receiving this because you (or someone else) have requested the reset of the password for your account.
                       Please click on the following link, or paste this into your browser to complete the process:
                       <a href="${config.serverURL}${config.routes.admin}/reset/${token}">
                        ${config.serverURL}${config.routes.admin}/reset/${token}
                       </a>
                       If you did not request this, please ignore this email and your password will remain unchanged.`;

  email({
    from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
    to: data.email,
    subject: 'Password Reset',
    html,
  });

  // /////////////////////////////////////
  // 3. Execute after forgot password hook
  // /////////////////////////////////////

  const { afterForgotPassword } = args.req.collection.config.hooks;

  if (typeof afterForgotPassword === 'function') {
    await afterForgotPassword(options);
  }
};

module.exports = forgotPassword;
