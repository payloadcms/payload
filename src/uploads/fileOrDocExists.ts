import fs from 'fs';
import { promisify } from 'util';
import { CollectionModel } from '../collections/config/types';

const stat = promisify(fs.stat);

const fileOrDocExists = async (Model: CollectionModel, path: string, filename: string): Promise<boolean> => {
  try {
    const doc = await Model.findOne({ filename });
    if (doc) return true;

    await stat(`${path}/${filename}`);

    return true;
  } catch (err) {
    return false;
  }
};

export default fileOrDocExists;
