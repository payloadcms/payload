import fs from 'fs';
import sharp from 'sharp';
import sanitize from 'sanitize-filename';
import { ProbedImageSize } from './getImageSize';
import fileExists from './fileExists';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { FileSizes, ImageSize } from './types';
import { PayloadRequest } from '../express/types';

function getOutputImage(sourceImage: string, size: ImageSize) {
  const extension = sourceImage.split('.').pop();
  const name = sanitize(sourceImage.substr(0, sourceImage.lastIndexOf('.')) || sourceImage);

  return {
    name,
    extension,
    width: size.width,
    height: size.height,
  };
}

/**
 * @description
 * @param staticPath Path to save images
 * @param config Payload config
 * @param savedFilename
 * @param mimeType
 * @returns image sizes keyed to strings
 */
export default async function resizeAndSave(
  req: PayloadRequest,
  file: Buffer,
  dimensions: ProbedImageSize,
  staticPath: string,
  config: SanitizedCollectionConfig,
  savedFilename: string,
  mimeType: string,
): Promise<FileSizes> {
  const { imageSizes, disableLocalStorage } = config.upload;

  const sizes = imageSizes
    .filter((desiredSize) => desiredSize.width < dimensions.width)
    .map(async (desiredSize) => {
      const resized = await sharp(file)
        .resize(desiredSize.width, desiredSize.height, {
          position: desiredSize.crop || 'centre',
        });

      const bufferObject = await resized.toBuffer({
        resolveWithObject: true,
      });

      req.payloadUploadSizes[desiredSize.name] = bufferObject.data;

      const outputImage = getOutputImage(savedFilename, desiredSize);
      const imageNameWithDimensions = `${outputImage.name}-${bufferObject.info.width}x${bufferObject.info.height}.${outputImage.extension}`;
      const imagePath = `${staticPath}/${imageNameWithDimensions}`;
      const fileAlreadyExists = await fileExists(imagePath);

      if (fileAlreadyExists) {
        fs.unlinkSync(imagePath);
      }

      if (!disableLocalStorage) {
        await resized.toFile(imagePath);
      }

      return {
        name: desiredSize.name,
        width: bufferObject.info.width,
        height: bufferObject.info.height,
        filename: imageNameWithDimensions,
        filesize: bufferObject.info.size,
        mimeType,
      };
    });

  const savedSizes = await Promise.all(sizes);

  return savedSizes.reduce((results, size) => ({
    ...results,
    [size.name]: {
      width: size.width,
      height: size.height,
      filename: size.filename,
      mimeType: size.mimeType,
      filesize: size.filesize,
    },
  }), {});
}
