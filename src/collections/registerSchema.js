import mongoose from 'mongoose';
import mongooseHidden from 'mongoose-hidden';
import paginate from 'mongoose-paginate-v2';
import autopopulate from 'mongoose-autopopulate';
import buildQueryPlugin from '../mongoose/buildQuery';
import localizationPlugin from '../localization/plugin';
import passwordResetConfig from '../auth/passwordResets/config';
import buildSchema from '../mongoose/schema/buildSchema';

const addSchema = (collection, config) => {
  if (collection.auth) {
    collection.fields.push(...passwordResetConfig.fields);
  }

  const schema = buildSchema(collection.fields, config, { timestamps: collection.timestamps });

  schema.plugin(paginate)
    .plugin(buildQueryPlugin)
    .plugin(localizationPlugin, config.localization)
    .plugin(autopopulate)
    .plugin(mongooseHidden());

  if (collection.plugins) {
    collection.plugins.forEach((plugin) => {
      schema.plugin(plugin.plugin, plugin.options);
    });
  }

  return {
    config: collection,
    model: mongoose.model(collection.slug, schema),
  };
};

export default addSchema;
