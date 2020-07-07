const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const mongooseHidden = require('mongoose-hidden')({
  hidden: {
    _id: true, __v: true,
  },
  applyRecursively: true,
});
const buildSchema = require('../mongoose/buildSchema');
const localizationPlugin = require('../localization/plugin');

const buildModel = (config) => {
  if (config.globals && config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema({}, { discriminatorKey: 'globalType', timestamps: false })
      .plugin(localizationPlugin, config.localization)
      .plugin(autopopulate)
      .plugin(mongooseHidden);

    const Globals = mongoose.model('globals', globalsSchema);

    Object.values(config.globals).forEach((globalConfig) => {
      const globalSchema = buildSchema(globalConfig.fields);
      Globals.discriminator(globalConfig.slug, globalSchema);
    });

    return Globals;
  }

  return null;
};

module.exports = buildModel;
