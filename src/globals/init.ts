import express from 'express';
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import buildQueryPlugin from '../mongoose/buildQuery';
import buildModel from './buildModel';
import { Payload } from '../index';
import { getVersionsModelName } from '../versions/getVersionsModelName';
import { buildVersionGlobalFields } from '../versions/buildGlobalFields';
import buildSchema from '../mongoose/buildSchema';
import { CollectionModel } from '../collections/config/types';

export default function initGlobals(ctx: Payload): void {
  if (ctx.config.globals) {
    ctx.globals = {
      Model: buildModel(ctx.config),
      config: ctx.config.globals,
    };

    ctx.config.globals.forEach((global) => {
      if (global.versions) {
        const versionModelName = getVersionsModelName(global);

        const versionSchema = buildSchema(
          ctx.config,
          buildVersionGlobalFields(global),
          {
            disableUnique: true,
            options: {
              timestamps: true,
            },
          },
        );

        versionSchema.plugin(paginate, { useEstimatedCount: true })
          .plugin(buildQueryPlugin);

        ctx.versions[global.slug] = mongoose.model(versionModelName, versionSchema) as CollectionModel;
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

        if (global.versions) {
          router.route(`/globals/${global.slug}/versions`)
            .get(ctx.requestHandlers.globals.findVersions(global));

          router.route(`/globals/${global.slug}/versions/:id`)
            .get(ctx.requestHandlers.globals.findVersionByID(global))
            .post(ctx.requestHandlers.globals.restoreVersion(global));
        }
      });

      ctx.router.use(router);
    }
  }
}
