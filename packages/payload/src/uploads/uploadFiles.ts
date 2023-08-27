import type { TFunction } from 'i18next';
import { FileUploadError } from '../errors.js';
import saveBufferToFile from './saveBufferToFile.js';
import { FileToSave } from './types.js';
import { Payload } from '../payload.js';

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
