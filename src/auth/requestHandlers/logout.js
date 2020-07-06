const logoutHandler = config => async (req, res) => {
  const { collection } = req;

  const cookieOptions = {
    expires: new Date(0),
    httpOnly: true,
    path: '/',
    overwrite: true,
  };

  if (collection.auth && collection.auth.secureCookie) {
    cookieOptions.secure = true;
  }

  res.cookie(`${config.cookiePrefix}-token`, '', cookieOptions);

  return res.status(200).json({
    message: 'Logged out successfully.',
  });
};

module.exports = logoutHandler;
