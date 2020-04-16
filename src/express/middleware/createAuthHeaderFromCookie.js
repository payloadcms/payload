const createAuthHeaderFromCookie = (req, _, next) => {
  if (process.env.NODE_ENV !== 'production' || this.config.productionGraphQLPlayground) {
    const existingAuthHeader = req.get('Authorization');
    const { token } = req.cookies;

    if (!existingAuthHeader && token) {
      req.headers.authorization = `JWT ${token}`;
    }
  }

  next();
};

module.exports = createAuthHeaderFromCookie;
