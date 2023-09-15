import express from 'express';
import compression from 'compression';
import history from 'connect-history-api-fallback';
import type { PayloadHandler } from '../../../config/types';
import { Payload } from '../../../payload';

const router = express.Router();

type ServeAdminType = (options: { payload: Payload }) => Promise<PayloadHandler>;

export const serveAdmin: ServeAdminType = async ({ payload }) => {
  router.use(payload.config.routes.admin, history());

  router.get('*', (req, res, next) => {
    if (req.path.substr(-1) === '/' && req.path.length > 1) {
      const query = req.url.slice(req.path.length);
      res.redirect(301, req.path.slice(0, -1) + query);
    } else {
      next();
    }
  });

  router.use(compression(payload.config.express.compression));
  router.use(express.static(payload.config.admin.buildPath, { redirect: false }));

  return router;
};
