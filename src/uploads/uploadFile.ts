import { fromBuffer } from 'file-type';
import mkdirp from 'mkdirp';
import path from 'path';
import sanitize from 'sanitize-filename';
import sharp, { Sharp } from 'sharp';
import { Collection } from '../collections/config/types';
import { SanitizedConfig } from '../config/types';
import { FileUploadError, MissingFile } from '../errors';
import { PayloadRequest } from '../express/types';
import getImageSize from './getImageSize';
import getSafeFileName from './getSafeFilename';
import resizeAndSave from './imageResizer';
import isImage from './isImage';
import saveBufferToFile from './saveBufferToFile';
import { FileData } from './types';

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

    const { staticDir, imageSizes, disableLocalStorage, resizeOptions, formatOptions } = collectionConfig.upload;

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
      try {
        let fsSafeName: string;
        let resized: Sharp | undefined;
        if (isImage(file.mimetype)) {
          if (resizeOptions) {
            resized = sharp(file.data)
              .resize(resizeOptions);
          }
          if (formatOptions) {
            resized = (resized ?? sharp(file.data)).toFormat(formatOptions.format, formatOptions.options);
          }
        }

        const fileBuffer = resized ? (await resized.toBuffer()) : file.data;
        const {
          mime,
          ext,
        } = await fromBuffer(fileBuffer);
        const fileSize = fileBuffer.length;
        const baseFilename = sanitize(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
        fsSafeName = `${baseFilename}.${ext}`;

        if (!overwriteExistingFiles) {
          fsSafeName = await getSafeFileName(Model, staticPath, fsSafeName);
        }

        if (!disableLocalStorage) {
          await saveBufferToFile(fileBuffer, `${staticPath}/${fsSafeName}`);
        }

        fileData.filename = fsSafeName || (!overwriteExistingFiles ? await getSafeFileName(Model, staticPath, file.name) : file.name);
        fileData.filesize = fileSize || file.size;
        fileData.mimeType = mime || (await fromBuffer(file.data)).mime;
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
            savedFilename: fsSafeName || file.name,
            mimeType: fileData.mimeType,
          });
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
