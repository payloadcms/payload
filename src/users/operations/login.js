const jwt = require('jsonwebtoken');
const { Forbidden } = require('../../errors');

const login = async (args) => {
  try {
    // Await validation here

    let options = { ...args };

    // /////////////////////////////////////
    // 1. Execute before login hook
    // /////////////////////////////////////

    const beforeLoginHook = args.config.hooks && args.config.hooks.beforeLogin;

    if (typeof beforeLoginHook === 'function') {
      options = await beforeLoginHook(options);
    }

    // /////////////////////////////////////
    // 2. Perform login
    // /////////////////////////////////////

    const {
      Model,
      config,
      data,
    } = options;

    const usernameField = config.auth.useAsUsername;
    const username = data[usernameField];
    const { password } = data;

    const user = await Model.findByUsername(username);

    if (!user) throw new Forbidden();

    await user.authenticate(password);

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
    // 3. Execute after login hook
    // /////////////////////////////////////

    const afterLoginHook = args.config && args.config.hooks && args.config.hooks.afterLogin;

    if (typeof afterLoginHook === 'function') {
      await afterLoginHook(options, token);
    }

    // /////////////////////////////////////
    // 4. Return token
    // /////////////////////////////////////

    return token;
  } catch (error) {
    throw error;
  }
};

module.exports = login;
