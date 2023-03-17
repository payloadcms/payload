import fs from 'fs';
import { promisify } from 'util';
import { mapAsync } from '../utilities/mapAsync';
import type { PayloadRequest } from '../express/types';
import type { SanitizedConfig } from '../config/types';
import type { SanitizedCollectionConfig } from '../collections/config/types';

const unlinkFile = promisify(fs.unlink);

type Args = {
  req: PayloadRequest
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
}
/**
 * Remove temp files if enabled, as express-fileupload does not do this automatically
 */
export const unlinkTempFiles: (args: Args) => Promise<void> = async ({
  req,
  config,
  collectionConfig,
}) => {
  if (config.upload?.useTempFiles && collectionConfig.upload) {
    const { files } = req;
    const fileArray = Array.isArray(files) ? files : [files];
    await mapAsync(fileArray, async ({ file }) => {
      // Still need this check because this will not be populated if using local API
      if (file.tempFilePath) {
        await unlinkFile(file.tempFilePath);
      }
    });
  }
};
