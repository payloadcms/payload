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
import mountEndpoints from '../express/mountEndpoints';
import buildEndpoints from './buildEndpoints';
import { SanitizedGlobalConfig } from './config/types';

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
            draftsEnabled: true,
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
      ctx.config.globals.forEach((global: SanitizedGlobalConfig) => {
        const router = express.Router();
        const { slug } = global;

        const endpoints = buildEndpoints(global);
        mountEndpoints(ctx.express, router, endpoints);

        ctx.router.use(`/globals/${slug}`, router);
      });
    }
  }
}
