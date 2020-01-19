import passport from 'passport';
import HttpStatus from 'http-status';

const requireAuth = (req, res) => {
  if (!req.user) {
    res.status(HttpStatus.UNAUTHORIZED)
      .send();
  }
};

export const loadPolicy = (policy) => {
  return [
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    (req, res, next) => {
      if (policy) {
        if (!policy(req.user)) {
          return res.status(HttpStatus.FORBIDDEN)
            .send('Role not authorized.');
        }

        return next();
      }
      requireAuth(req, res);
    }];
};
