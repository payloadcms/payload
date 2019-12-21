import mongoose from 'mongoose';
import localizationPlugin from '../../localization/plugin';

const imageUploadModelLoader = (Upload, config) => {

  const ImageSchema = new mongoose.Schema(
    {
      sizes: [{
        name: { type: String },
        height: { type: Number },
        width: { type: Number },
        _id: false
      }]
    }
  );

  ImageSchema.plugin(localizationPlugin, config.localization);

  return Upload.discriminator('image', ImageSchema);

};

export default imageUploadModelLoader;
