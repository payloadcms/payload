import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import buildQueryPlugin from '../mongoose/buildQuery';
import localizationPlugin from '../localization/plugin';

const uploadModelLoader = (config) => {
  const UploadSchema = new mongoose.Schema({
    filename: { type: String },
  }, {
    timestamps: true,
    discriminatorKey: 'type',
  });

  UploadSchema.plugin(paginate);
  UploadSchema.plugin(buildQueryPlugin);
  UploadSchema.plugin(localizationPlugin, config.localization);

  return mongoose.model('Upload', UploadSchema);
};

export default uploadModelLoader;
