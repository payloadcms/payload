import { FileUploadError } from '../errors';
import saveBufferToFile from './saveBufferToFile';
import { FileToSave } from './types';
import { Payload } from '..';

export const uploadFiles = async (payload: Payload, files: FileToSave[]): Promise<void> => {
  try {
    await Promise.all(files.map(async ({ buffer, path }) => {
      await saveBufferToFile(buffer, path);
    }));
  } catch (err) {
    payload.logger.error(err);
    throw new FileUploadError();
  }
};
