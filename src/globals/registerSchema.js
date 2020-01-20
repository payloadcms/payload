import mongoose from 'mongoose';
import mongooseHidden from 'mongoose-hidden';
import autopopulate from 'mongoose-autopopulate';
import fieldToSchemaMap from '../mongoose/schema/fieldToSchemaMap';
import localizationPlugin from '../localization/plugin';

const registerSchema = (globalConfigs, config) => {
  const globalFields = {};
  const globalSchemaGroups = {};
  const globals = {
    config: {},
  };

  Object.values(globalConfigs).forEach((globalConfig) => {
    globals.config[globalConfig.label] = globalConfig;
    globalFields[globalConfig.slug] = {};

    globalConfig.fields.forEach((field) => {
      const fieldSchema = fieldToSchemaMap[field.type];
      if (fieldSchema) globalFields[globalConfig.slug][field.name] = fieldSchema(field, { path: globalConfig.slug, localization: config.localization });
    });
    globalSchemaGroups[globalConfig.slug] = globalFields[globalConfig.slug];
  });

  globals.model = mongoose.model(
    'globals',
    new mongoose.Schema({ ...globalSchemaGroups, timestamps: false })
      .plugin(localizationPlugin, config.localization)
      .plugin(autopopulate)
      .plugin(mongooseHidden()),
  );

  return globals;
};

export default registerSchema;
