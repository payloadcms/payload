const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const getExtractJWT = require('../getExtractJWT');

const { APIError } = require('../../errors');

async function me({ req }) {
  const extractJWT = getExtractJWT(this.config);

  if (req.user) {
    const requestedSlug = req.route.path.split('/').filter((r) => r !== '')[0];
    const user = { ...req.user };

    if (user.collection !== requestedSlug) {
      throw new APIError('Incorrect collection', httpStatus.FORBIDDEN);
    }

    delete user.collection;

    const response = {
      user,
      collection: req.user.collection,
    };

    const token = extractJWT(req);

    if (token) {
      response.token = token;
      const decoded = jwt.decode(token);
      if (decoded) response.exp = decoded.exp;
    }

    return response;
  }

  return {
    user: null,
  };
}

module.exports = me;
