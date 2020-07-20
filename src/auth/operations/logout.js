async function logout(args) {
  const { config } = this;

  const {
    collection: {
      config: collectionConfig,
    },
    res,
    req,
  } = args;

  const cookieOptions = {
    expires: new Date(0),
    httpOnly: true,
    path: '/',
    overwrite: true,
  };

  if (collectionConfig.auth && collectionConfig.auth.secureCookie) {
    cookieOptions.secure = true;
  }

  if (req.headers.origin && req.headers.origin.indexOf('localhost') === -1) {
    let domain = req.headers.origin.replace('https://', '');
    domain = req.headers.origin.replace('http://', '');
    cookieOptions.domain = domain;
  }

  res.cookie(`${config.cookiePrefix}-token`, '', cookieOptions);

  return 'Logged out successfully.';
}

module.exports = logout;
