import passport from 'passport';
import jwtStrategy from '../auth/jwt';
import initRoutes from '../routes/init';
import authRoutes from '../auth/routes';
import {
  query, create, findOne, destroy, update,
} from '../mongoose/requestHandlers';
import bindModelMiddleware from '../mongoose/bindModel';
import setModelLocaleMiddleware from '../localization/setModelLocale';

const registerRoutes = ({ model, config }, router) => {
  // register passport with model
  if (config.auth) {
    passport.use(model.createStrategy());

    if (config.auth.strategy === 'jwt') {
      passport.use(jwtStrategy(model));
      passport.serializeUser(model.serializeUser());
      passport.deserializeUser(model.deserializeUser());
    }

    router.use('', initRoutes(model));
    router.use('', authRoutes(config, model));
  }

  router.all(`/${config.slug}*`,
    bindModelMiddleware(model),
    setModelLocaleMiddleware());

  router.route(`/${config.slug}`)
    .get(config.policies.read, query)
    .post(config.policies.create, create);

  router.route(`/${config.slug}/:id`)
    .get(config.policies.read, findOne)
    .put(config.policies.update, update)
    .delete(config.policies.destroy, destroy);
};

export default registerRoutes;
