const jwt = require('jsonwebtoken');

const meHandler = async (req, res, next) => {
  try {
    if (req.user) {
      const response = req.user;

      if (req.headers.authorization && req.headers.authorization.indexOf('JWT') === 0) {
        const token = req.headers.authorization.replace('JWT ', '');
        if (token) {
          const decoded = jwt.decode(token);

          if (decoded.exp) {
            response.exp = decoded.exp;
          }
        }
      }

      return res.status(200).json(response);
    }
    return res.status(200).json(null);
  } catch (err) {
    next(err);
  }

  return next();
};

module.exports = meHandler;
