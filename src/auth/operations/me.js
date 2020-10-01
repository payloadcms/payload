const jwt = require('jsonwebtoken');
const getExtractJWT = require('../getExtractJWT');

async function me({ req }) {
  const extractJWT = getExtractJWT(this.config);

  if (req.user) {
    const user = { ...req.user };
    delete user.collection;

    const response = {
      user: req.user,
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
