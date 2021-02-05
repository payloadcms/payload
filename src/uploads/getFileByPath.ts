import fs from 'fs';
import mime from 'mime';
import { File } from './types';

const getFileByPath = (filePath: string): File => {
  if (typeof filePath === 'string') {
    const data = fs.readFileSync(filePath);
    const mimetype = mime.getType(filePath);

    const name = filePath.split('/').pop();

    return {
      data,
      mimetype,
      name,
    };
  }

  return undefined;
};

export default getFileByPath;
