import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);

export const fileExists = async (fileName: string): Promise<boolean> => {
  try {
    await stat(fileName);
    return true;
  } catch (err) {
    return false;
  }
};
