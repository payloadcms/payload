const express = require('express');
const passport = require('passport');
const getExecuteStaticAccess = require('../auth/getExecuteStaticAccess');
const authenticate = require('./middleware/authenticate');

function initStatic() {
  Object.entries(this.collections).forEach(([_, collection]) => {
    const { config } = collection;

    if (config.upload) {
      const router = express.Router();

      router.use(passport.initialize());
      router.use(authenticate(this.config));

      router.use(getExecuteStaticAccess(collection));
      router.use(express.static(config.upload.staticDir));

      this.express.use(`${config.upload.staticURL}`, router);
    }
  });
}

module.exports = initStatic;
