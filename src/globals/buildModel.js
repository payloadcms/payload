const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const mongooseHidden = require('mongoose-hidden')();
const buildSchema = require('../mongoose/buildSchema');
const localizationPlugin = require('../localization/plugin');

const buildModel = (config) => {
  if (config.globals && config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema({}, { discriminatorKey: 'globalType', timestamps: true });

    if (config.localization) {
      globalsSchema.plugin(localizationPlugin, config.localization);
    }

    globalsSchema.plugin(autopopulate);
    globalsSchema.plugin(mongooseHidden);

    const Globals = mongoose.model('globals', globalsSchema);

    Object.values(config.globals).forEach((globalConfig) => {
      const globalSchema = buildSchema(globalConfig.fields);

      if (config.localization) {
        globalSchema.plugin(localizationPlugin, config.localization);
      }

      globalSchema.plugin(autopopulate);
      globalSchema.plugin(mongooseHidden);

      Globals.discriminator(globalConfig.slug, globalSchema);
    });

    return Globals;
  }

  return null;
};

module.exports = buildModel;
