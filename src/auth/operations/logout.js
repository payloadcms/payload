async function logout(args) {
  const { config } = this;

  const {
    res,
  } = args;

  const cookieOptions = {
    path: '/',
  };

  res.clearCookie(`${config.cookiePrefix}-token`, cookieOptions);

  return 'Logged out successfully.';
}

module.exports = logout;
