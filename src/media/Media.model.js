import mongoose from 'mongoose';
import buildQueryPlugin from '../mongoose/buildQuery.plugin';
import paginate from '../mongoose/paginate.plugin';
import localizationPlugin from '../localization/localization.plugin';

const mediaModelLoader = (config) => {
  const MediaSchema = new mongoose.Schema({
      name: { type: String, intl: true },
      caption: { type: String, intl: true },
      description: { type: String, intl: true },
      filename: { type: String },
      sizes: [{
        height: { type: Number},
        width: { type: Number},
        _id: false
      }]
    },
    { timestamps: true }
  );

  MediaSchema.plugin(paginate);
  MediaSchema.plugin(buildQueryPlugin);
  MediaSchema.plugin(localizationPlugin, config.localization);

  return mongoose.model('Media', MediaSchema);
};

export default mediaModelLoader;
