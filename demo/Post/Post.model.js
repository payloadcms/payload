import mongoose from 'mongoose';
import mongooseApiQuery from '../../src/utils/mongooseApiQuery';
import mongooseIntl from 'mongoose-intl';
import payloadConfig from '.././payload.config';

const PostSchema = new mongoose.Schema({
    content: {type: String}
  }
);

PostSchema.plugin(mongooseApiQuery);

PostSchema.plugin(mongooseIntl, payloadConfig.localization);

module.exports = mongoose.model('Post', PostSchema);
