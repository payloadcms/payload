const jwt = require('jsonwebtoken');
const getExtractJWT = require('../getExtractJWT');

const me = async ({ req, config }) => {
  try {
    const extractJWT = getExtractJWT(config);

    if (req.user) {
      const response = req.user;

      const token = extractJWT(req);

      if (token) {
        const decoded = jwt.decode(token);
        if (decoded) {
          response.exp = decoded.exp;
        }
      }

      return response;
    }

    return null;
  } catch (error) {
    throw error;
  }
};

module.exports = me;
