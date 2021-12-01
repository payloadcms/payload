import { CollectionModel } from '../collections/config/types';

const docWithFilenameExists = async (Model: CollectionModel, path: string, filename: string): Promise<boolean> => {
  const doc = await Model.findOne({ filename });
  if (doc) return true;

  return false;
};

export default docWithFilenameExists;
