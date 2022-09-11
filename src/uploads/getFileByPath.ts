import fs from 'fs';
import { fromFile } from 'file-type';
import path from 'path';
import { File } from './types';

const getFileByPath = async (filePath: string): Promise<File> => {
  if (typeof filePath === 'string') {
    const data = fs.readFileSync(filePath);
    const mimetype = fromFile(filePath);
    const { size } = fs.statSync(filePath);

    const name = path.basename(filePath);

    return {
      data,
      mimetype: (await mimetype).mime,
      name,
      size,
    };
  }

  return undefined;
};

export default getFileByPath;
