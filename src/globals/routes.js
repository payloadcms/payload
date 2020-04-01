const express = require('express');
const requestHandlers = require('./requestHandlers');
const setModelLocaleMiddleware = require('../localization/setModelLocale');
const bindModelMiddleware = require('../mongoose/bindModel');
const loadPolicy = require('../auth/loadPolicy');
const getMiddleware = require('./middleware');

const { upsert, findOne } = requestHandlers;

const router = express.Router();

const registerGlobals = (globalConfigs, Globals) => {
  router.all('/globals*',
    bindModelMiddleware(Globals),
    setModelLocaleMiddleware());

  globalConfigs.forEach((global) => {
    router.all(`/globals/${global.slug}`, getMiddleware(global));

    router
      .route(`/globals/${global.slug}`)
      .get(loadPolicy(global.policies.read), findOne)
      .post(loadPolicy(global.policies.create), upsert)
      .put(loadPolicy(global.policies.update), upsert);
  });

  return router;
};

module.exports = registerGlobals;
