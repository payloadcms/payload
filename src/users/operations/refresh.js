const jwt = require('jsonwebtoken');

const refresh = async (args) => {
  try {
    // Await validation here

    let options = { ...args };

    // /////////////////////////////////////
    // 1. Execute before refresh hook
    // /////////////////////////////////////

    const { beforeRefresh } = args.config.hooks;

    if (typeof beforeRefresh === 'function') {
      options = await beforeRefresh(options);
    }

    // /////////////////////////////////////
    // 2. Perform refresh
    // /////////////////////////////////////

    const secret = options.config.auth.secretKey;
    const opts = {};
    opts.expiresIn = options.config.auth.tokenExpiration;

    const token = options.authorization.replace('JWT ', '');
    const payload = jwt.verify(token, secret, {});
    delete payload.iat;
    delete payload.exp;
    const refreshedToken = jwt.sign(payload, secret, opts);

    // /////////////////////////////////////
    // 3. Execute after login hook
    // /////////////////////////////////////

    const { afterRefresh } = args.config.hooks;

    if (typeof afterRefresh === 'function') {
      await afterRefresh(options, refreshedToken);
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
