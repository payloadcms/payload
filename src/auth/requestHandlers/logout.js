const logoutHandler = config => async (req, res) => {
  res.cookie(`${config.cookiePrefix}-token`, '', {
    expires: new Date(0), httpOnly: true, path: '/', overwrite: true,
  });

  return res.status(200).json({
    message: 'Logged out successfully.',
  });
};

module.exports = logoutHandler;
