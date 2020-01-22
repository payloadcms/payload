const requestHandlers = require('../mongoose/requestHandlers');
const bindModelMiddleware = require('../mongoose/bindModel');
const setModelLocaleMiddleware = require('../localization/setModelLocale');
const loadPolicy = require('../auth/loadPolicy');
const bindCollectionMiddleware = require('./bindCollection');

const {
  query, create, findOne, destroy, update,
} = requestHandlers;

const registerRoutes = ({ model, config }, router) => {
  router.all(`/${config.slug}*`,
    bindModelMiddleware(model),
    bindCollectionMiddleware(config),
    setModelLocaleMiddleware());

  router.route(`/${config.slug}`)
    .get(loadPolicy(config.policies.read), query)
    .post(loadPolicy(config.policies.create), create);

  router.route(`/${config.slug}/:id`)
    .get(loadPolicy(config.policies.read), findOne)
    .put(loadPolicy(config.policies.update), update)
    .delete(loadPolicy(config.policies.destroy), destroy);
};

module.exports = registerRoutes;
