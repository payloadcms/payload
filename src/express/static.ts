import express from 'express';
import passport from 'passport';
import path from 'path';
import getExecuteStaticAccess from '../auth/getExecuteStaticAccess';
import authenticate from './middleware/authenticate';

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

export default initStatic;
