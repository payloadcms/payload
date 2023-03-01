import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import buildQueryPlugin from '../mongoose/buildQuery';
import buildModel from './buildModel';
import { Payload } from '../payload';
import { getVersionsModelName } from '../versions/getVersionsModelName';
import { buildVersionGlobalFields } from '../versions/buildGlobalFields';
import buildSchema from '../mongoose/buildSchema';
import { CollectionModel } from '../collections/config/types';

export default function initGlobalsLocal(ctx: Payload): void {
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
              timestamps: false,
              minimize: false,
            },
          },
        );

        versionSchema.plugin(paginate, { useEstimatedCount: true })
          .plugin(buildQueryPlugin);

        ctx.versions[global.slug] = mongoose.model(versionModelName, versionSchema) as CollectionModel;
      }
    });
  }
}
