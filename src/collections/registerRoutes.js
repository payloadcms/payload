import passport from 'passport';
import jwtStrategy from '../auth/jwt';
import initRoutes from '../routes/init';
import authRoutes from '../auth/routes';
import {
  query, create, findOne, destroy, update,
} from '../mongoose/requestHandlers';
import { upload as uploadMedia, update as updateMedia } from '../uploads/requestHandlers';
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

  // TODO: this feels sloppy, need to discuss media enabled collection handlers
  const createHandler = config.media ? (req, res, next) => uploadMedia(req, res, next, config.media) : create;
  const updateHandler = config.media ? (req, res, next) => updateMedia(req, res, next, config.media) : update;
  // TODO: Do we need a delete?

  router.route(`/${config.slug}`)
    .get(config.policies.read, query)
    .post(config.policies.create, createHandler);

  router.route(`/${config.slug}/:id`)
    .get(config.policies.read, findOne)
    .put(config.policies.update, updateHandler)
    .delete(config.policies.destroy, destroy);
};

export default registerRoutes;
