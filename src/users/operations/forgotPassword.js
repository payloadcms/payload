const crypto = require('crypto');
const { APIError } = require('../../errors');

const forgotPassword = async (args) => {
  try {
    const usernameField = args.config.user.auth.useAsUsername;

    if (!Object.prototype.hasOwnProperty.call(args.data, usernameField)) {
      throw new APIError('Missing username.');
    }

    let options = {
      Model: args.Model,
      config: args.config,
      api: args.api,
      data: args.data,
      email: args.email,
    };

    // /////////////////////////////////////
    // 1. Execute before login hook
    // /////////////////////////////////////

    const beforeForgotPasswordHook = args.config.user.hooks && args.config.user.hooks.beforeForgotPassword;

    if (typeof beforeForgotPasswordHook === 'function') {
      options = await beforeForgotPasswordHook(options);
    }

    // /////////////////////////////////////
    // 2. Perform forgot password
    // /////////////////////////////////////

    const {
      Model,
      config,
      data,
      email,
    } = options;

    let token = await crypto.randomBytes(20);
    token = token.toString('hex');

    const user = await Model.findOne({ [usernameField]: data[usernameField] });

    if (!user) return;

    user.resetPasswordToken = token;
    user.resetPasswordExpiration = Date.now() + 3600000; // 1 hour

    await user.save();

    const emailText = `You are receiving this because you (or someone else) have requested the reset of the password for your account.
                       Please click on the following link, or paste this into your browser to complete the process:
                       ${config.serverURL}${config.routes.admin}/reset/${token}
                       If you did not request this, please ignore this email and your password will remain unchanged.`;

    email.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
      to: data[usernameField],
      subject: 'Password Reset',
      text: emailText,
    });

    // /////////////////////////////////////
    // 3. Execute after forgot password hook
    // /////////////////////////////////////

    const afterForgotPasswordHook = args.config.user.hooks && args.config.user.hooks.afterForgotPassword;

    if (typeof afterForgotPasswordHook === 'function') {
      await afterForgotPasswordHook(options);
    }

    // /////////////////////////////////////
    // 4. Return
    // /////////////////////////////////////

    return;
  } catch (error) {
    throw error;
  }
};

module.exports = forgotPassword;
