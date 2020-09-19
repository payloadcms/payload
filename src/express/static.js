const express = require('express');
const passport = require('passport');
const path = require('path');
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

      const staticPath = path.resolve(this.config.paths.configDir, config.upload.staticDir);

      router.use(express.static(staticPath));

      this.express.use(`${config.upload.staticURL}`, router);
    }
  });
}

module.exports = initStatic;
