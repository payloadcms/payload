import mongoose from 'mongoose';
import fieldToSchemaMap from '../mongoose/schema/fieldToSchemaMap';
import autopopulate from '../mongoose/autopopulate';
import localizationPlugin from '../localization/plugin';

const registerGlobals = ({ config }) => {
  const globalFields = {};
  const globalSchemaGroups = {};
  const globals = {
    config: {},
  };

  Object.values(config.globals).forEach((globalConfig) => {
    globals.config[globalConfig.label] = globalConfig;
    globalFields[globalConfig.slug] = {};

    globalConfig.fields.forEach((field) => {
      const fieldSchema = fieldToSchemaMap[field.type];
      if (fieldSchema) globalFields[globalConfig.slug][field.name] = fieldSchema(field, { path: globalConfig.slug, localization: config.localization });
    });
    globalSchemaGroups[globalConfig.slug] = new mongoose.Schema(globalFields[globalConfig.slug], { _id: false })
      .plugin(localizationPlugin, config.localization)
      .plugin(autopopulate);
  });

  globals.model = mongoose.model(
    'global',
    new mongoose.Schema({ ...globalSchemaGroups, timestamps: false })
      .plugin(localizationPlugin, config.localization)
      .plugin(autopopulate),
  );

  return globals;
};

export default registerGlobals;
