const createAuthHeaderFromCookie = (req, _, next) => {
  if (process.env.NODE_ENV !== 'production' || this.config.productionGraphQLPlayground) {
    const existingAuthHeader = req.get('Authorization');
    const token = req.cookies[`${this.config.cookiePrefix}-token`];

    if (!existingAuthHeader && token) {
      req.headers.authorization = `JWT ${token}`;
    }
  }

  next();
};

module.exports = createAuthHeaderFromCookie;
