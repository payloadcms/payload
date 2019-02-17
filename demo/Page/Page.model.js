import mongoose from 'mongoose';
import buildQuery from '../../src/plugins/buildQuery';
import paginate from '../../src/plugins/paginate';
import internationalization from '../../src/plugins/internationalization';
import payloadConfig from '.././payload.config';
import { schemaBaseFields } from '../../src/helpers/mongoose/schemaBaseFields';

const PageSchema = new mongoose.Schema({
  ...schemaBaseFields,
  title: { type: String, intl: true, unique: true },
  content: { type: String, intl: true },
  //slug: { type: String, intl: true, unique: true, required: true },
  metaTitle: String,
  metaDesc: String
},
  { timestamps: true }
);

PageSchema.plugin(paginate);
PageSchema.plugin(buildQuery);
PageSchema.plugin(internationalization, payloadConfig.localization);

module.exports = mongoose.model('Page', PageSchema);
