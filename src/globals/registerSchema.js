const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const mongooseHidden = require('mongoose-hidden');
const buildSchema = require('../mongoose/schema/buildSchema');
const localizationPlugin = require('../localization/plugin');

const registerSchema = (globalConfigs, config) => {
  const globals = {
    config: globalConfigs,
    model: {},
  };

  if (globalConfigs && globalConfigs.length > 0) {
    const globalsSchema = new mongoose.Schema({}, { discriminatorKey: 'globalType', timestamps: false })
      .plugin(localizationPlugin, config.localization)
      .plugin(autopopulate)
      .plugin(mongooseHidden());

    const Globals = mongoose.model('globals', globalsSchema);

    Object.values(globalConfigs).forEach((globalConfig) => {
      const globalSchema = buildSchema(globalConfig.fields, config);

      globalSchema
        .plugin(localizationPlugin, config.localization)
        .plugin(autopopulate)
        .plugin(mongooseHidden());

      Globals.discriminator(globalConfig.slug, globalSchema);
    });

    globals.model = Globals;
  }

  return globals;
};

module.exports = registerSchema;
