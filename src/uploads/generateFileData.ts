import { fromBuffer } from 'file-type';
import mkdirp from 'mkdirp';
import path from 'path';
import sanitize from 'sanitize-filename';
import sharp, { Sharp } from 'sharp';
import { Collection } from '../collections/config/types';
import { SanitizedConfig } from '../config/types';
import { FileUploadError, MissingFile } from '../errors';
import { PayloadRequest } from '../express/types';
import getImageSize, { ProbedImageSize } from './getImageSize';
import getSafeFileName from './getSafeFilename';
import resizeAndSave from './imageResizer';
import { FileData, FileToSave } from './types';
import canResizeImage from './canResizeImage';

type Args = {
  config: SanitizedConfig,
  collection: Collection
  throwOnMissingFile?: boolean
  req: PayloadRequest
  data: Record<string, unknown>
  overwriteExistingFiles?: boolean
}

type Result = Promise<{
  data: Record<string, unknown>
  files: FileToSave[]
}>

export const generateFileData = async ({
  config,
  collection: {
    config: collectionConfig,
    Model,
  },
  req,
  data,
  throwOnMissingFile,
  overwriteExistingFiles,
}: Args): Result => {
  let newData = data;
  const filesToSave: FileToSave[] = [];

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
        const shouldResize = canResizeImage(file.mimetype);
        let fsSafeName: string;
        let resized: Sharp | undefined;
        let dimensions: ProbedImageSize;
        if (shouldResize) {
          if (resizeOptions) {
            resized = sharp(file.data)
              .resize(resizeOptions);
          }
          if (formatOptions) {
            resized = (resized ?? sharp(file.data)).toFormat(formatOptions.format, formatOptions.options);
          }
          dimensions = await getImageSize(file);
          fileData.width = dimensions.width;
          fileData.height = dimensions.height;
        }

        const fileBuffer = resized ? (await resized.toBuffer()) : file.data;

        const { mime, ext } = await fromBuffer(fileBuffer) ?? { mime: file.mimetype, ext: file.name.split('.').pop() };
        const fileSize = fileBuffer.length;
        const baseFilename = sanitize(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
        fsSafeName = `${baseFilename}.${ext}`;

        if (!overwriteExistingFiles) {
          fsSafeName = await getSafeFileName(Model, staticPath, fsSafeName);
        }

        filesToSave.push({
          path: `${staticPath}/${fsSafeName}`,
          buffer: fileBuffer,
        });

        fileData.filename = fsSafeName || (!overwriteExistingFiles ? await getSafeFileName(Model, staticPath, file.name) : file.name);
        fileData.filesize = fileSize || file.size;
        fileData.mimeType = mime || (await fromBuffer(file.data)).mime;

        if (Array.isArray(imageSizes) && shouldResize) {
          req.payloadUploadSizes = {};
          const { sizeData, sizesToSave } = await resizeAndSave({
            req,
            file: file.data,
            dimensions,
            staticPath,
            config: collectionConfig,
            savedFilename: fsSafeName || file.name,
            mimeType: fileData.mimeType,
          });

          fileData.sizes = sizeData;
          filesToSave.push(...sizesToSave);
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

  return {
    data: newData,
    files: filesToSave,
  };
};
