const jwt = require('jsonwebtoken');

const refresh = async (args) => {
  try {
    // Await validation here

    let options = {
      config: args.config,
      api: args.api,
      authorization: args.authorization,
    };

    // /////////////////////////////////////
    // 1. Execute before refresh hook
    // /////////////////////////////////////

    const beforeRefreshHook = args.config.user && args.config.user.hooks && args.config.user.hooks.beforeRefresh;

    if (typeof beforeRefreshHook === 'function') {
      options = await beforeRefreshHook(options);
    }

    // /////////////////////////////////////
    // 2. Perform refresh
    // /////////////////////////////////////

    const secret = options.config.user.auth.secretKey;
    const opts = {};
    opts.expiresIn = options.config.user.auth.tokenExpiration;

    const token = options.authorization.replace('JWT ', '');
    jwt.verify(token, secret, {});
    const refreshedToken = jwt.sign(token, secret);

    // /////////////////////////////////////
    // 3. Execute after login hook
    // /////////////////////////////////////

    const afterRefreshHook = args.config.user && args.config.user.hooks && args.config.user.hooks.afterRefresh;

    if (typeof afterRefreshHook === 'function') {
      await afterRefreshHook(options, refreshedToken);
    }

    // /////////////////////////////////////
    // 4. Return refreshed token
    // /////////////////////////////////////

    return refreshedToken;
  } catch (error) {
    throw error;
  }
};

module.exports = refresh;
