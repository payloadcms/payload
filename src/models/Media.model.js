import mongoose from 'mongoose';
import buildQuery from '../plugins/buildQuery';
import paginate from '../plugins/paginate';
import internationalization from '../plugins/internationalization';

const mediaModelLoader = (config) => {
  const MediaSchema = new mongoose.Schema({
    name: { type: String, intl: true},
    caption: { type: String, intl: true},
    description: { type: String, intl: true},
    filename: { type: String},
  });

  MediaSchema.plugin(paginate);
  MediaSchema.plugin(buildQuery);
  MediaSchema.plugin(internationalization, config.localization);

  return mongoose.model('Media', MediaSchema);
};

export default mediaModelLoader;
