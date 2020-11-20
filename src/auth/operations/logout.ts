const httpStatus = require('http-status');
const { APIError } = require('../../errors');

async function logout(args) {
  const { config } = this;

  const requestedSlug = args.req.route.path.split('/').filter((r) => r !== '')[0];
  if (!args.req.user) throw new APIError('No User', httpStatus.BAD_REQUEST);
  if (args.req.user.collection !== requestedSlug) throw new APIError('Incorrect collection', httpStatus.FORBIDDEN);

  const {
    res,
    collection: {
      config: collectionConfig,
    },
  } = args;

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: collectionConfig.auth.cookies.secure,
    sameSite: collectionConfig.auth.cookies.sameSite,
  };

  res.clearCookie(`${config.cookiePrefix}-token`, cookieOptions);

  return 'Logged out successfully.';
}

export default logout;
