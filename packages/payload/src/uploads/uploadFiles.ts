import type { TFunction } from 'i18next';

import type { Payload } from '../payload.js';
import type { FileToSave } from './types.js';

import { FileUploadError } from '../errors/index.js';
import saveBufferToFile from './saveBufferToFile.js';

export const uploadFiles = async (payload: Payload, files: FileToSave[], t: TFunction): Promise<void> => {
  try {
    await Promise.all(files.map(async ({ buffer, path }) => {
      await saveBufferToFile(buffer, path);
    }));
  } catch (err) {
    payload.logger.error(err);
    throw new FileUploadError(t);
  }
};
