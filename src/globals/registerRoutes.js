const requestHandlers = require('./requestHandlers');
const setModelLocaleMiddleware = require('../localization/setModelLocale');
const bindModelMiddleware = require('../mongoose/bindModel');

const { upsert, fetch } = requestHandlers;

const registerGlobals = (globals, router) => {
  router.all('/globals*',
    bindModelMiddleware(globals),
    setModelLocaleMiddleware());

  router
    .route('/globals')
    .get(fetch);

  router
    .route('/globals/:slug')
    .get(fetch)
    .post(upsert)
    .put(upsert);
};

module.exports = registerGlobals;
