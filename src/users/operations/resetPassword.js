const jwt = require('jsonwebtoken');
const { APIError } = require('../../errors');

const resetPassword = async (args) => {
  try {
    if (!Object.prototype.hasOwnProperty.call(args.data, 'token')
      || !Object.prototype.hasOwnProperty.call(args.data, 'password')) {
      throw new APIError('Missing required data.');
    }

    let options = { ...args };

    // /////////////////////////////////////
    // 1. Execute before reset password hook
    // /////////////////////////////////////

    const beforeResetPasswordHook = args.config.hooks && args.config.hooks.beforeResetPassword;

    if (typeof beforeResetPasswordHook === 'function') {
      options = await beforeResetPasswordHook(options);
    }

    // /////////////////////////////////////
    // 2. Perform password reset
    // /////////////////////////////////////

    const {
      Model,
      config,
      data,
    } = options;

    const { username } = data;

    const user = await Model.findOne({
      resetPasswordToken: data.token,
      resetPasswordExpiration: { $gt: Date.now() },
    });

    if (!user) throw new APIError('Token is either invalid or has expired.');


    await user.setPassword(data.password);

    user.resetPasswordExpiration = Date.now();

    await user.save();

    await user.authenticate(data.password);

    const fieldsToSign = config.fields.reduce((signedFields, field) => {
      if (field.saveToJWT) {
        return {
          ...signedFields,
          [field.name]: user[field.name],
        };
      }
      return signedFields;
    }, {
      [usernameField]: username,
    });

    const token = jwt.sign(
      fieldsToSign,
      config.auth.secretKey,
      {
        expiresIn: config.auth.tokenExpiration,
      },
    );

    // /////////////////////////////////////
    // 3. Execute after reset password hook
    // /////////////////////////////////////

    const afterResetPasswordHook = args.config.hooks && args.config.hooks.afterResetPassword;

    if (typeof afterResetPasswordHook === 'function') {
      await afterResetPasswordHook(options, user);
    }

    // /////////////////////////////////////
    // 4. Return updated user
    // /////////////////////////////////////

    return token;
  } catch (error) {
    throw error;
  }
};

module.exports = resetPassword;
