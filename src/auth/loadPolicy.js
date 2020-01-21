const passport = require('passport');
const HttpStatus = require('http-status');

const requireAuth = (req, res) => {
  if (!req.user) {
    res.status(HttpStatus.UNAUTHORIZED)
      .send();
  }
};

const loadPolicy = (policy) => {
  return [
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    (req, res, next) => {
      if (policy) {
        if (!policy(req.user)) {
          return res.status(HttpStatus.FORBIDDEN)
            .send('Not authorized.');
        }

        return next();
      }
      return requireAuth(req, res);
    }];
};

module.exports = loadPolicy;
