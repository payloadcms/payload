import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);

export default async (fileName) => {
  try {
    await stat(fileName);
    return true;
  } catch (err) {
    return false;
  }
};
