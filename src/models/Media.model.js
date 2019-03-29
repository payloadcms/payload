import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  name: { type: String },
  caption: { type: String },
  description: { type: String },
  filename: { type: String },
});

export default mongoose.model('Media', MediaSchema);
