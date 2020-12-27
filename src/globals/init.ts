import express from 'express';
import buildModel from './buildModel';
import { Payload } from '../index';

export default function initGlobals(ctx: Payload): void {
  if (ctx.config.globals) {
    ctx.globals = {
      Model: buildModel(ctx.config),
      config: ctx.config.globals,
    };

    // If not local, open routes
    if (!ctx.config.local) {
      const router = express.Router();

      ctx.config.globals.forEach((global) => {
        router
          .route(`/globals/${global.slug}`)
          .get(ctx.requestHandlers.globals.findOne(global))
          .post(ctx.requestHandlers.globals.update(global));
      });

      ctx.router.use(router);
    }
  }
}
