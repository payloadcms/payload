const requestHandlers = require('./requestHandlers');
const setModelLocaleMiddleware = require('../localization/setModelLocale');
const bindModelMiddleware = require('../mongoose/bindModel');
const loadPolicy = require('../auth/loadPolicy');
const bindGlobalMiddleware = require('../globals/bindGlobalMiddleware');

const { upsert, findOne } = requestHandlers;

const registerGlobals = (globals, router) => {
  router.all('/globals*',
    bindModelMiddleware(globals.model),
    setModelLocaleMiddleware());

  globals.config.forEach((global) => {
    router.all(`/globals/${global.slug}`, bindGlobalMiddleware(global));

    router
      .route(`/globals/${global.slug}`)
      .get(loadPolicy(global.policies.read), findOne)
      .post(loadPolicy(global.policies.create), upsert)
      .put(loadPolicy(global.policies.update), upsert);
  });
};

module.exports = registerGlobals;
