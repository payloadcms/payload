const express = require('express');
const requestHandlers = require('./requestHandlers');
const bindModelMiddleware = require('../express/middleware/bindModel');
const setModelLocaleMiddleware = require('../localization/setModelLocale');
const loadPolicy = require('../auth/loadPolicy');
const bindCollectionMiddleware = require('./bindCollection');

const {
  query, create, findByID, destroy, update,
} = requestHandlers;

const router = express.Router();

const registerRoutes = ({ model, config }) => {
  router.all(`/${config.slug}*`,
    bindModelMiddleware(model),
    bindCollectionMiddleware(config),
    setModelLocaleMiddleware());

  router.route(`/${config.slug}`)
    .get(loadPolicy(config.policies.read), query)
    .post(loadPolicy(config.policies.create), create);

  router.route(`/${config.slug}/:id`)
    .get(loadPolicy(config.policies.read), findByID)
    .put(loadPolicy(config.policies.update), update)
    .delete(loadPolicy(config.policies.destroy), destroy);

  return router;
};

module.exports = registerRoutes;
