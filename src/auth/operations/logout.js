async function logout(args) {
  const { config } = this;

  const {
    res,
    req,
  } = args;

  const cookieOptions = {
    path: '/',
  };

  if (req.headers.origin && req.headers.origin.indexOf('localhost') === -1) {
    let domain = req.headers.origin.replace('https://', '');
    domain = domain.replace('http://', '');
    cookieOptions.domain = domain;
  }

  res.clearCookie(`${config.cookiePrefix}-token`, cookieOptions);

  return 'Logged out successfully.';
}

module.exports = logout;
