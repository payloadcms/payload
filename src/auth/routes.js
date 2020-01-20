import express from 'express';
import passport from 'passport';
import httpStatus from 'http-status';
import APIError from '../errors/APIError';
import authRequestHandlers from './requestHandlers';
import authValidate from './validate';
import passwordResetRoutes from './passwordResets/routes';

const router = express.Router();
const authRoutes = (userConfig, User) => {
  const auth = authRequestHandlers(userConfig, User);

  const usernameField = userConfig.useAsUsername || 'email';

  router
    .route('/login')
    .post(authValidate.login, auth.login);

  router
    .route('/me')
    .post(passport.authenticate(userConfig.auth.strategy, { session: false }), auth.me);

  if (userConfig.auth.passwordResets) {
    router.use('', passwordResetRoutes(userConfig.email, User));
  }

  if (userConfig.auth.registration) {
    router
      .route(`${userConfig.slug}/register`) // TODO: not sure how to incorporate url params like `:pageId`
      .post(auth.register);

    router
      .route('/first-register')
      .post((req, res, next) => {
        User.countDocuments({}, (err, count) => {
          if (err) res.status(500).json({ error: err });
          if (count >= 1) return res.status(403).json({ initialized: true });
          next();
        });
      }, (req, res, next) => {
        User.register(new User(req.body), req.body.password, (err) => {
          if (err) {
            const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
            return next(error);
          }

          return next();
        });
      }, auth.login);
  }

  return router;
};

export default authRoutes;
