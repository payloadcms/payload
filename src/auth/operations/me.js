const jwt = require('jsonwebtoken');
const getExtractJWT = require('../getExtractJWT');

const me = async ({ req, config }) => {
  const extractJWT = getExtractJWT(config);

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
};

module.exports = me;
