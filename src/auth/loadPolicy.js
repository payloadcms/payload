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
        policy(req, res, next);
      } else {
        requireAuth(req, res);
      }
    }];
};
