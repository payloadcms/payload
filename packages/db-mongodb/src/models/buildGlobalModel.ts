import mongoose from 'mongoose';
import { SanitizedConfig } from '@alessiogr/payloadtest/config';
import buildSchema from './buildSchema.js';
import getBuildQueryPlugin from '../queries/buildQuery.js';
import type { GlobalModel } from '../types.js';

export const buildGlobalModel = (config: SanitizedConfig): GlobalModel | null => {
  if (config.globals && config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema({}, { discriminatorKey: 'globalType', timestamps: true, minimize: false });

    globalsSchema.plugin(getBuildQueryPlugin());

    const Globals = mongoose.model('globals', globalsSchema, 'globals') as unknown as GlobalModel;

    Object.values(config.globals).forEach((globalConfig) => {
      const globalSchema = buildSchema(
        config,
        globalConfig.fields,
        {
          options: {
            minimize: false,
          },
        },
      );
      Globals.discriminator(globalConfig.slug, globalSchema);
    });

    return Globals;
  }

  return null;
};
