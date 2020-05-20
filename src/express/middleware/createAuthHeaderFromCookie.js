const createAuthHeaderFromCookie = config => (req, _, next) => {
  if (process.env.NODE_ENV !== 'production' || config.productionGraphQLPlayground) {
    const existingAuthHeader = req.get('Authorization');
    const token = req.cookies[`${config.cookiePrefix}-token`];

    if (!existingAuthHeader && token) {
      req.headers.authorization = `JWT ${token}`;
    }
  }

  next();
};

module.exports = createAuthHeaderFromCookie;
