import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);

const fileExists = async (filename: string): Promise<boolean> => {
  try {
    await stat(filename);

    return true;
  } catch (err) {
    return false;
  }
};

export default fileExists;
