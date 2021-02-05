import mongoose from 'mongoose';
import buildSchema from '../mongoose/buildSchema';
import localizationPlugin from '../localization/plugin';
import { Config } from '../config/types';

const buildModel = (config: Config): mongoose.PaginateModel<any> | null => {
  if (config.globals && config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema({}, { discriminatorKey: 'globalType', timestamps: true });

    if (config.localization) {
      globalsSchema.plugin(localizationPlugin, config.localization);
    }

    const Globals = mongoose.model('globals', globalsSchema);

    Object.values(config.globals).forEach((globalConfig) => {
      const globalSchema = buildSchema(config, globalConfig.fields, {});

      if (config.localization) {
        globalSchema.plugin(localizationPlugin, config.localization);
      }

      Globals.discriminator(globalConfig.slug, globalSchema);
    });

    return Globals;
  }

  return null;
};

export default buildModel;
