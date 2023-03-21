import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { File } from './types';

const getFileByPath = async (filePath: string): Promise<File> => {
  if (typeof filePath === 'string') {
    const data = fs.readFileSync(filePath);
    const mimetype = mime.getType(filePath);

    const { size } = fs.statSync(filePath);

    const name = path.basename(filePath);

    return {
      data,
      mimetype,
      name,
      size,
    };
  }

  return undefined;
};

export default getFileByPath;
