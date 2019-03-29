import mongoose from 'mongoose';
import buildQuery from '../plugins/buildQuery';
import paginate from '../plugins/paginate';

const MediaSchema = new mongoose.Schema({
  name: { type: String },
  caption: { type: String },
  description: { type: String },
  filename: { type: String },
});

MediaSchema.plugin(paginate);
MediaSchema.plugin(buildQuery);

export default mongoose.model('Media', MediaSchema);
