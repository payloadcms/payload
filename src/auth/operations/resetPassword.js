const jwt = require('jsonwebtoken');
const { APIError } = require('../../errors');

async function resetPassword(args) {
  const { config } = this;

  if (!Object.prototype.hasOwnProperty.call(args.data, 'token')
    || !Object.prototype.hasOwnProperty.call(args.data, 'password')) {
    throw new APIError('Missing required data.');
  }

  let options = { ...args };

  // /////////////////////////////////////
  // 1. Execute before reset password hook
  // /////////////////////////////////////

  const { beforeResetPassword } = args.collection.config.hooks;

  if (typeof beforeResetPassword === 'function') {
    options = await beforeResetPassword(options);
  }

  // /////////////////////////////////////
  // 2. Perform password reset
  // /////////////////////////////////////

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    data,
  } = options;

  const user = await Model.findOne({
    resetPasswordToken: data.token,
    resetPasswordExpiration: { $gt: Date.now() },
  });

  if (!user) throw new APIError('Token is either invalid or has expired.');

  await user.setPassword(data.password);

  user.resetPasswordExpiration = Date.now();

  await user.save();

  await user.authenticate(data.password);

  const fieldsToSign = collectionConfig.fields.reduce((signedFields, field) => {
    if (field.saveToJWT) {
      return {
        ...signedFields,
        [field.name]: user[field.name],
      };
    }
    return signedFields;
  }, {
    email: user.email,
    id: user.id,
    collection: collectionConfig.slug,
  });

  const token = jwt.sign(
    fieldsToSign,
    config.secret,
    {
      expiresIn: collectionConfig.auth.tokenExpiration,
    },
  );

  if (args.res) {
    const cookieOptions = {
      path: '/',
      httpOnly: true,
    };

    if (collectionConfig.auth.secureCookie) {
      cookieOptions.secure = true;
    }

    if (args.req.headers.origin && args.req.headers.origin.indexOf('localhost') === -1) {
      let domain = args.req.headers.origin.replace('https://', '');
      domain = domain.replace('http://', '');
      cookieOptions.domain = domain;
    }

    args.res.cookie(`${config.cookiePrefix}-token`, token, cookieOptions);
  }

  // /////////////////////////////////////
  // 3. Execute after reset password hook
  // /////////////////////////////////////

  const { afterResetPassword } = collectionConfig.hooks;

  if (typeof afterResetPassword === 'function') {
    await afterResetPassword(options, user);
  }

  // /////////////////////////////////////
  // 4. Return updated user
  // /////////////////////////////////////

  return token;
}

module.exports = resetPassword;
