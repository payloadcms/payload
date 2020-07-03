const jwt = require('jsonwebtoken');
const { Forbidden } = require('../../errors');

const refresh = async (args) => {
  try {
    // Await validation here

    let options = { ...args };

    // /////////////////////////////////////
    // 1. Execute before refresh hook
    // /////////////////////////////////////

    const { beforeRefresh } = args.collection.config.hooks;

    if (typeof beforeRefresh === 'function') {
      options = await beforeRefresh(options);
    }

    // /////////////////////////////////////
    // 2. Perform refresh
    // /////////////////////////////////////

    const { secret, cookiePrefix } = options.config;
    const opts = {};
    opts.expiresIn = options.collection.config.auth.tokenExpiration;

    if (typeof options.authorization !== 'string') throw new Forbidden();

    const token = options.authorization.replace('JWT ', '');
    const payload = jwt.verify(token, secret, {});
    delete payload.iat;
    delete payload.exp;
    const refreshedToken = jwt.sign(payload, secret, opts);

    if (args.res) {
      args.res.cookie(`${cookiePrefix}-token`, refreshedToken, { path: '/', httpOnly: true });
    }

    // /////////////////////////////////////
    // 3. Execute after login hook
    // /////////////////////////////////////

    const { afterRefresh } = args.collection.config.hooks;

    if (typeof afterRefresh === 'function') {
      await afterRefresh(options, refreshedToken);
    }

    // /////////////////////////////////////
    // 4. Return refreshed token
    // /////////////////////////////////////

    payload.exp = jwt.decode(refreshedToken).exp;

    return {
      refreshedToken,
      user: payload,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = refresh;
