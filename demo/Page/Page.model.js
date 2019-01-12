import mongoose from 'mongoose';
import mongooseStringQuery from 'mongoose-string-query';
import mongooseIntl from 'mongoose-intl';
import payloadConfig from '.././payload.config';

const PageSchema = new mongoose.Schema({
    title: {type: String, intl: true},
    content: {type: String, intl: true},
    slug: {type: String, unique: true, required: true},
    metaTitle: String,
    metaDesc: String
  }
  , {
  toJSON: {
    virtuals: true,
  }}
);

PageSchema.plugin(mongooseStringQuery);

// TODO: This should be able to be done as a global mongoose plugin
PageSchema.plugin(mongooseIntl, payloadConfig.localization);

module.exports = mongoose.model('Page', PageSchema);
