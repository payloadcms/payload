import express from 'express';
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import buildQueryPlugin from '../mongoose/buildQuery';
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

        revisionSchema.plugin(paginate, { useEstimatedCount: true })
          .plugin(buildQueryPlugin);

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

        if (global.revisions) {
          router.route(`/globals/${global.slug}/revisions`)
            .get(ctx.requestHandlers.globals.findRevisions(global));

          router.route(`/globals/${global.slug}/revisions/:id`)
            .get(ctx.requestHandlers.globals.findRevisionByID(global));
        }
      });

      ctx.router.use(router);
    }
  }
}
