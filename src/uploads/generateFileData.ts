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
import isImage from './isImage';

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
      throw new MissingFile(req.t);
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
        let dimensions;
        let fileBuffer;
        let bufferInfo;
        let ext;
        let mime;

        if (shouldResize) {
          if (resizeOptions) {
            resized = sharp(file.data)
              .resize(resizeOptions);
          }
          if (formatOptions) {
            resized = (resized ?? sharp(file.data)).toFormat(formatOptions.format, formatOptions.options);
          }
        }

        if (isImage(file.mimetype)) {
          dimensions = await getImageSize(file);
          fileData.width = dimensions.width;
          fileData.height = dimensions.height;
        }

        if (resized) {
          fileBuffer = await resized.toBuffer({ resolveWithObject: true });
          bufferInfo = await fromBuffer(fileBuffer.data);

          mime = bufferInfo.mime;
          ext = bufferInfo.ext;
          fileData.width = fileBuffer.info.width;
          fileData.height = fileBuffer.info.height;
          fileData.filesize = fileBuffer.data.length;
        } else {
          mime = file.mimetype;
          fileData.filesize = file.size;
          ext = file.name.split('.').pop();
        }

        if (mime === 'application/xml' && ext === 'svg') mime = 'image/svg+xml';
        fileData.mimeType = mime;

        const baseFilename = sanitize(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
        fsSafeName = `${baseFilename}.${ext}`;

        if (!overwriteExistingFiles) {
          fsSafeName = await getSafeFileName(Model, staticPath, `${baseFilename}.${ext}`);
        }

        fileData.filename = fsSafeName;

        filesToSave.push({
          path: `${staticPath}/${fsSafeName}`,
          buffer: fileBuffer?.data || file.data,
        });

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
        throw new FileUploadError(req.t);
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
