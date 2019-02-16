import mongoose from 'mongoose';
import buildQuery from '../../src/plugins/buildQuery';
import paginate from '../../src/plugins/paginate';
import mongooseIntl from 'mongoose-intl';
import payloadConfig from '.././payload.config';
import { schemaBaseFields } from '../../src/helpers/mongoose/schemaBaseFields';

const PageSchema = new mongoose.Schema({
  ...schemaBaseFields,
  title: { type: String, intl: true, unique: true },
  content: { type: String, intl: true },
  metaTitle: String,
  metaDesc: String
},
  { timestamps: true }
);

PageSchema.plugin(paginate);
PageSchema.plugin(buildQuery);

const formattedIntl = {
  defaultLanguage: payloadConfig.localization.defaultLocale,
  languages: payloadConfig.localization.locales
};

PageSchema.plugin(mongooseIntl, formattedIntl);

module.exports = mongoose.model('Page', PageSchema);
