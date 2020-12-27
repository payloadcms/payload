import express from 'express';
import passport from 'passport';
import path from 'path';
import getExecuteStaticAccess from '../auth/getExecuteStaticAccess';
import authenticate from './middleware/authenticate';
import { Payload } from '../index';

function initStatic(ctx: Payload) {
  Object.entries(ctx.collections).forEach(([_, collection]) => {
    const { config } = collection;

    if (config.upload) {
      const router = express.Router();

      router.use(passport.initialize());
      router.use(authenticate(ctx.config));

      router.use(getExecuteStaticAccess(collection));

      const staticPath = path.resolve(ctx.config.paths.configDir, config.upload.staticDir);

      router.use(express.static(staticPath));

      ctx.express.use(`${config.upload.staticURL}`, router);
    }
  });
}

export default initStatic;
