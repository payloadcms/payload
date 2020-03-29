const requestHandlers = require('./requestHandlers');
const setModelLocaleMiddleware = require('../localization/setModelLocale');
const bindModelMiddleware = require('../mongoose/bindModel');

const { upsert, findOne, findAll } = requestHandlers;

const registerGlobals = (globals, router) => {
  router.all('/globals*',
    bindModelMiddleware(globals),
    setModelLocaleMiddleware());

  router
    .route('/globals')
    .get(findAll);

  router
    .route('/globals/:slug')
    .get(findOne)
    .post(upsert)
    .put(upsert);
};

module.exports = registerGlobals;
