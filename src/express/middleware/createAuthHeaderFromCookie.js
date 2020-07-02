const createAuthHeaderFromCookie = config => (req, _, next) => {
  const existingAuthHeader = req.get('Authorization');

  if (req.cookies) {
    const token = req.cookies[`${config.cookiePrefix}-token`];

    if (!existingAuthHeader && token) {
      req.headers.authorization = `JWT ${token}`;
    }
  }

  next();
};

module.exports = createAuthHeaderFromCookie;
