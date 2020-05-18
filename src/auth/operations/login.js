const jwt = require('jsonwebtoken');
const { Unauthorized, AuthenticationError } = require('../../errors');

const login = async (args) => {
  try {
    // Await validation here

    let options = { ...args };

    // /////////////////////////////////////
    // 1. Execute before login hook
    // /////////////////////////////////////

    const beforeLoginHook = args.collection.config.hooks.beforeLogin;

    if (typeof beforeLoginHook === 'function') {
      options = await beforeLoginHook(options);
    }

    // /////////////////////////////////////
    // 2. Perform login
    // /////////////////////////////////////

    const {
      collection: {
        Model,
        config: collectionConfig,
      },
      config,
      data,
    } = options;

    const { email, password } = data;

    const user = await Model.findByUsername(email);

    if (!user) throw new AuthenticationError();

    const authResult = await user.authenticate(password);

    if (!authResult.user) {
      throw new AuthenticationError();
    }

    const fieldsToSign = collectionConfig.fields.reduce((signedFields, field) => {
      if (field.saveToJWT) {
        return {
          ...signedFields,
          [field.name]: user[field.name],
        };
      }
      return signedFields;
    }, {
      email,
    });

    const token = jwt.sign(
      fieldsToSign,
      config.secret,
      {
        expiresIn: collectionConfig.auth.tokenExpiration,
      },
    );

    // /////////////////////////////////////
    // 3. Execute after login hook
    // /////////////////////////////////////

    const afterLoginHook = args.collection.config.hooks.afterLogin;

    if (typeof afterLoginHook === 'function') {
      await afterLoginHook({ ...options, token, user });
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
