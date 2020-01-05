import {
  query, create, findOne, destroy, update,
} from '../mongoose/requestHandlers';
import bindModelMiddleware from '../mongoose/bindModel';
import setModelLocaleMiddleware from '../localization/setModelLocale';
import { loadPolicy } from '../auth/loadPolicy';

const registerRoutes = ({ model, config }, router) => {
  router.all(`/${config.slug}*`,
    bindModelMiddleware(model),
    setModelLocaleMiddleware());

  router.route(`/${config.slug}`)
    .get(loadPolicy(config.policies.read), query)
    .post(loadPolicy(config.policies.create), create);

  router.route(`/${config.slug}/:id`)
    .get(loadPolicy(config.policies.read), findOne)
    .put(loadPolicy(config.policies.update), update)
    .delete(loadPolicy(config.policies.destroy), destroy);
};

export default registerRoutes;
