const jwt = require('jsonwebtoken');
const { Forbidden } = require('../../errors');
const getCookieExpiration = require('../../utilities/getCookieExpiration');

async function refresh(args) {
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

  const {
    collection: {
      config: collectionConfig,
    },
  } = options;

  const opts = {};
  opts.expiresIn = options.collection.config.auth.tokenExpiration;

  if (typeof options.token !== 'string') throw new Forbidden();

  const payload = jwt.verify(options.token, this.config.secret, {});
  delete payload.iat;
  delete payload.exp;
  const refreshedToken = jwt.sign(payload, this.config.secret, opts);

  if (args.res) {
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      expires: getCookieExpiration(collectionConfig.auth.tokenExpiration),
      secure: collectionConfig.auth.cookies.secure,
      sameSite: collectionConfig.auth.cookies.sameSite,
    };


    if (collectionConfig.auth.cookies.domain) cookieOptions.domain = collectionConfig.auth.cookies.domain;

    args.res.cookie(`${this.config.cookiePrefix}-token`, refreshedToken, cookieOptions);
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
}

module.exports = refresh;
