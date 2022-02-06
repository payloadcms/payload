import mkdirp from 'mkdirp';
import path from 'path';
import { SanitizedConfig } from '../config/types';
import { Collection } from '../collections/config/types';
import { FileUploadError, MissingFile } from '../errors';
import { PayloadRequest } from '../express/types';
import { FileData } from './types';
import saveBufferToFile from './saveBufferToFile';
import getSafeFileName from './getSafeFilename';
import getImageSize from './getImageSize';
import resizeAndSave from './imageResizer';
import isImage from './isImage';

type Args = {
  config: SanitizedConfig,
  collection: Collection
  throwOnMissingFile?: boolean
  req: PayloadRequest
  data: Record<string, unknown>
  overwriteExistingFiles?: boolean
}

const uploadFile = async ({
  config,
  collection: {
    config: collectionConfig,
    Model,
  },
  req,
  data,
  throwOnMissingFile,
  overwriteExistingFiles,
}: Args): Promise<Record<string, unknown>> => {
  let newData = data;

  if (collectionConfig.upload) {
    const fileData: Partial<FileData> = {};

    const { staticDir, imageSizes, disableLocalStorage } = collectionConfig.upload;

    const { file } = req.files || {};

    if (throwOnMissingFile && !file) {
      throw new MissingFile();
    }

    let staticPath = staticDir;

    if (staticDir.indexOf('/') !== 0) {
      staticPath = path.resolve(config.paths.configDir, staticDir);
    }

    if (!disableLocalStorage) {
      mkdirp.sync(staticPath);
    }

    if (file) {
      const fsSafeName = !overwriteExistingFiles ? await getSafeFileName(Model, staticPath, file.name) : file.name;

      try {
        if (!disableLocalStorage) {
          await saveBufferToFile(file.data, `${staticPath}/${fsSafeName}`);
        }

        fileData.filename = fsSafeName;
        fileData.filesize = file.size;
        fileData.mimeType = file.mimetype;

        if (isImage(file.mimetype)) {
          const dimensions = await getImageSize(file);
          fileData.width = dimensions.width;
          fileData.height = dimensions.height;

          if (Array.isArray(imageSizes) && file.mimetype !== 'image/svg+xml') {
            req.payloadUploadSizes = {};
            fileData.sizes = await resizeAndSave({
              req,
              file: file.data,
              dimensions,
              staticPath,
              config: collectionConfig,
              savedFilename: fsSafeName,
              mimeType: fileData.mimeType,
            });
          }
        }
      } catch (err) {
        console.error(err);
        throw new FileUploadError();
      }

      newData = {
        ...newData,
        ...fileData,
      };
    }
  }

  return newData;
};

export default uploadFile;
