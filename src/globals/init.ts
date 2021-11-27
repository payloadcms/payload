import express from 'express';
import mongoose from 'mongoose';
import buildModel from './buildModel';
import { Payload } from '../index';
import { getRevisionsModelName } from '../revisions/getRevisionsModelName';
import { buildRevisionGlobalFields } from '../revisions/buildGlobalFields';
import buildSchema from '../mongoose/buildSchema';
import { GlobalModel } from './config/types';

export default function initGlobals(ctx: Payload): void {
  if (ctx.config.globals) {
    ctx.globals = {
      Model: buildModel(ctx.config),
      config: ctx.config.globals,
    };

    ctx.config.globals.forEach((global) => {
      if (global.revisions) {
        const revisionModelName = getRevisionsModelName(global);

        const revisionSchema = buildSchema(
          ctx.config,
          buildRevisionGlobalFields(global),
          {
            disableUnique: true,
            options: {
              timestamps: true,
            },
          },
        );

        ctx.revisions[global.slug] = mongoose.model(revisionModelName, revisionSchema) as GlobalModel;
      }
    });

    // If not local, open routes
    if (!ctx.local) {
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
