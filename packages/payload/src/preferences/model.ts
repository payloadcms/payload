import mongoose, { Schema } from 'mongoose';
import { Preference } from './types';

const Model = mongoose.model<Preference>('_preferences', new Schema({
  user: {
    type: Schema.Types.ObjectId,
    refPath: 'userCollection',
  },
  userCollection: String,
  key: String,
  value: Schema.Types.Mixed,
}, { timestamps: true })
  .index({ user: 1, key: 1, userCollection: 1 }, { unique: true }));

export default Model;
