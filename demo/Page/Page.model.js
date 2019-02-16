import mongoose from 'mongoose';
import mongooseApiQuery from '../../src/utils/mongooseApiQuery';
import mongooseIntl from 'mongoose-intl';
import payloadConfig from '.././payload.config';
import { schemaBaseFields } from '../../src/helpers/mongoose/schemaBaseFields';

const PageSchema = new mongoose.Schema({
  ...schemaBaseFields,
  title: { type: String, intl: true, unique: true },
  content: { type: String, intl: true },
  slug: { type: String, intl: true, unique: true, required: true },
  metaTitle: String,
  metaDesc: String
},
  { timestamps: true }
);

PageSchema.plugin(mongooseApiQuery);

const formattedIntl = {
  defaultLanguage: payloadConfig.localization.defaultLocale,
  languages: payloadConfig.localization.locales
}

PageSchema.plugin(mongooseIntl, formattedIntl);

module.exports = mongoose.model('Page', PageSchema);
