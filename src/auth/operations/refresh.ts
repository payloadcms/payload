import jwt from 'jsonwebtoken';
import { Forbidden } from '../../errors';
import getCookieExpiration from '../../utilities/getCookieExpiration';

async function refresh(incomingArgs) {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'refresh',
    })) || args;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Refresh
  // /////////////////////////////////////

  const {
    collection: {
      config: collectionConfig,
    },
  } = args;

  const opts = {};
  opts.expiresIn = args.collection.config.auth.tokenExpiration;

  if (typeof args.token !== 'string') throw new Forbidden();

  const payload = jwt.verify(args.token, this.config.secret, {});
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
  // Return results
  // /////////////////////////////////////

  return {
    refreshedToken,
    exp: jwt.decode(refreshedToken).exp,
    user: payload,
  };
}

export default refresh;
