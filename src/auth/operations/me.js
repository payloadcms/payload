const jwt = require('jsonwebtoken');
const getExtractJWT = require('../getExtractJWT');

async function me({ req }) {
  const extractJWT = getExtractJWT(this.config);

  if (req.user) {
    const response = {
      user: req.user,
    };

    const token = extractJWT(req);

    if (token) {
      response.token = token;

      const decoded = jwt.decode(token);
      if (decoded) {
        response.user.exp = decoded.exp;
      }
    }

    return response;
  }

  return {
    user: null,
  };
}

module.exports = me;
