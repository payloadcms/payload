import express from 'express';
import authRequestHandlers from '../auth/requestHandlers';
import authValidate from '../auth/validate';
import passport from 'passport';
import checkRoleMiddleware from '../auth/checkRole.middleware';
import passwordResetRoutes from './passwordReset.routes';

const router = express.Router();
const authRoutes = (userConfig, User) => {

  let auth = authRequestHandlers(User);

  router
    .route('/login')
    .post(authValidate.login, auth.login);

  router
    .route('/me')
    .post(passport.authenticate(userConfig.auth.strategy, { session: false }), auth.me);

  userConfig.roles.forEach((role) => {
    router
      .route(`/role/${role}`)
      .get(passport.authenticate(userConfig.auth.strategy, { session: false }), checkRoleMiddleware(role), auth.me);
  });

  if (userConfig.auth.passwordResets) {
    router.use('', passwordResetRoutes(userConfig.email, User));
  }

  if (userConfig.auth.registration) {
    router
      .route(`${userConfig.slug}/register`) // TODO: not sure how to incorporate url params like `:pageId`
      .post(userConfig.auth.registrationValidation, auth.register);

    router
      .route('/first-register')
      .post(userConfig.auth.registrationValidation,
        (req, res, next) => {
          User.countDocuments({}, (err, count) => {
            if (err) res.status(500).json({ error: err });
            if (count >= 1)
              return res.status(403).json({ initialized: true });
            next();
          })
        },
        auth.register
      );
  }

  return router;
};

export default authRoutes;
