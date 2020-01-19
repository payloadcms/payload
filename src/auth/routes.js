import express from 'express';
import passport from 'passport';
import authRequestHandlers from './requestHandlers';
import authValidate from './validate';
import passwordResetRoutes from './passwordResets/routes';

const router = express.Router();
const authRoutes = (userConfig, User) => {
  const auth = authRequestHandlers(User);

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
      }, auth.register);
  }

  return router;
};

export default authRoutes;
