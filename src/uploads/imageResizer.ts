import fs from 'fs';
import sharp, { Sharp } from 'sharp';
import sanitize from 'sanitize-filename';
import { ProbedImageSize } from './getImageSize';
import fileExists from './fileExists';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { FileSizes, ImageSize } from './types';
import { PayloadRequest } from '../express/types';

type Args = {
  req: PayloadRequest
  file: Buffer
  dimensions: ProbedImageSize
  staticPath: string
  config: SanitizedCollectionConfig
  savedFilename: string
  mimeType: string
}

type OutputImage = {
  name: string,
  extension: string,
  width: number,
  height: number
}

function getOutputImage(sourceImage: string, size: ImageSize): OutputImage {
  const extension = sourceImage.split('.').pop();
  const name = sanitize(sourceImage.substring(0, sourceImage.lastIndexOf('.')) || sourceImage);

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
export default async function resizeAndSave({
  req,
  file,
  dimensions,
  staticPath,
  config,
  savedFilename,
  mimeType,
}: Args): Promise<FileSizes> {
  const { imageSizes, disableLocalStorage, resizeOptions, formatOptions } = config.upload;

  const sizes = imageSizes
    .filter((desiredSize) => needsResize(desiredSize, dimensions))
    .map(async (desiredSize) => {
      const defaultResizeOptions = { position: desiredSize.crop || 'centre' };
      let resized = await sharp(file).resize(
        desiredSize.width,
        desiredSize.height,
        resizeOptions ?? defaultResizeOptions,
      );

      if (formatOptions) {
        resized = resized.toFormat(...formatOptions);
      }

      const bufferObject = await resized.toBuffer({
        resolveWithObject: true,
      });

      req.payloadUploadSizes[desiredSize.name] = bufferObject.data;

      const outputImage = getOutputImage(savedFilename, desiredSize);
      const imageNameWithDimensions = createImageName(outputImage, bufferObject, formatOptions);
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
        mimeType: formatOptions ? `image/${formatOptions?.[0]}` : mimeType,
      };
    });

  const savedSizes = await Promise.all(sizes);

  return savedSizes.reduce(
    (results, size) => ({
      ...results,
      [size.name]: {
        width: size.width,
        height: size.height,
        filename: size.filename,
        mimeType: size.mimeType,
        filesize: size.filesize,
      },
    }),
    {},
  );
}
function createImageName(
  outputImage: OutputImage,
  bufferObject: { data: Buffer; info: sharp.OutputInfo },
  formatOptions: Parameters<Sharp['toFormat']>,
): string {
  const extension = formatOptions?.[0] ?? outputImage.extension;
  return `${outputImage.name}-${bufferObject.info.width}x${bufferObject.info.height}.${extension}`;
}

function needsResize(desiredSize: ImageSize, dimensions: ProbedImageSize): boolean {
  return (typeof desiredSize.width === 'number' && desiredSize.width <= dimensions.width)
    || (typeof desiredSize.height === 'number' && desiredSize.height <= dimensions.height);
}
