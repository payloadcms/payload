import { UploadedFile } from 'express-fileupload';
import { fromBuffer } from 'file-type';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import sharp from 'sharp';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { PayloadRequest } from '../express/types';
import fileExists from './fileExists';
import { FileSize, FileSizes, FileToSave, ImageSize, ProbedImageSize } from './types';

type ResizeArgs = {
  req: PayloadRequest;
  file: UploadedFile;
  dimensions: ProbedImageSize;
  staticPath: string;
  config: SanitizedCollectionConfig;
  savedFilename: string;
  mimeType: string;
};

type TransformResult = {
  sizeData: FileSizes;
  sizesToSave: FileToSave[];
};

type SanitizedImageData = {
  name: string;
  ext: string;
};

/**
 * Sanitize the image name and extract the extension from the source image
 *
 * @param sourceImage - the source image
 * @returns the sanitized name and extension
 */
const getSanitizedImageData = (sourceImage: string): SanitizedImageData => {
  const extension = sourceImage.split('.').pop();
  const name = sanitize(sourceImage.substring(0, sourceImage.lastIndexOf('.')) || sourceImage);
  return { name, ext: extension! };
};

/**
 * Create a new image name based on the output image name, the dimensions and
 * the extension.
 *
 * Ignore the fact that duplicate names could happen if the there is one
 * size with `width AND height` and one with only `height OR width`. Because
 * space is expensive, we will reuse the same image for both sizes.
 *
 * @param sanitizedImage - the sanitized image name
 * @param bufferInfo - the buffer info
 * @param extension - the extension to use
 * @param takenOutputNames - the taken output names
 * @returns the new image name that is not taken
 */
const createImageName = (
  outputImageName: string,
  { width, height }: sharp.OutputInfo,
  extension: string,
) => `${outputImageName}-${width}x${height}.${extension}`;

/**
 * Create the result object for the image resize operation based on the
 * provided parameters. If the name is not provided, an empty result object
 * is returned.
 *
 * @param name - the name of the image
 * @param filename - the filename of the image
 * @param width - the width of the image
 * @param height - the height of the image
 * @param filesize - the filesize of the image
 * @param mimeType - the mime type of the image
 * @param sizesToSave - the sizes to save
 * @returns the result object
 */
const createResult = (
  name: string,
  filename: FileSize['filename'] = null,
  width: FileSize['width'] = null,
  height: FileSize['height'] = null,
  filesize: FileSize['filesize'] = null,
  mimeType: FileSize['mimeType'] = null,
  sizesToSave: FileToSave[] = [],
): TransformResult => ({
  sizesToSave,
  sizeData: {
    [name]: {
      width,
      height,
      filename,
      filesize,
      mimeType,
    },
  },
});

/**
 * Check if the image needs to be resized according to the requested dimensions
 * and the original image size. If the resize options are provided, the image
 * will be resized regardless of the requested dimensions, given that the
 * width or height to be resized is provided.
 *
 * @param requestedDimensions - the requested dimensions
 * @param original - the original image size
 * @param resizeOptions - the resize options
 * @returns true if the image needs to be resized, false otherwise
 */
const needsResize = (
  { width, height, withoutEnlargement, withoutReduction }: ImageSize,
  original: ProbedImageSize,
): boolean => {
  // allow enlargement or prevent reduction (our default is to prevent
  // enlargement and allow reduction)
  if (withoutEnlargement === false || withoutReduction) {
    return true;
  }

  const isWidthOrHeightDefined = !!height || !!width;
  const hasInsufficientWidth = !!width && width <= original.width;
  const hasInsufficientHeight = !!height && height <= original.height;

  // If with and height are not defined, it means there is a format conversion
  // and the image needs to be "resized" (transformed).
  return !isWidthOrHeightDefined || hasInsufficientWidth || hasInsufficientHeight;
};

/**
 * Resize the image and provide the resize buffer. The image will be resized
 * according to the provided resize config. If no image sizes are requested,
 * the resolved data will be empty. For every image that dos not need to be
 * resized, an result object with `null` parameters will be returned.
 *
 * @param resizeConfig - the resize config
 * @returns the result of the resize operation(s)
 */
export default async function transformAndSaveImage({
  req,
  file,
  dimensions,
  staticPath,
  config,
  savedFilename,
  mimeType,
}: ResizeArgs): Promise<TransformResult> {
  const { imageSizes } = config.upload;

  // Noting to resize here so return as early as possible
  if (!imageSizes) return { sizeData: {}, sizesToSave: [] };

  const sharpBase = sharp(file.tempFilePath || file.data);

  const results: TransformResult[] = await Promise.all(
    imageSizes.map(async (imageResizeConfig): Promise<TransformResult> => {
      if (!needsResize(imageResizeConfig, dimensions)) {
        return createResult(imageResizeConfig.name);
      }

      let resized = sharpBase.clone().resize(imageResizeConfig);

      if (imageResizeConfig.formatOptions) {
        resized = resized.toFormat(
          imageResizeConfig.formatOptions.format,
          imageResizeConfig.formatOptions.options,
        );
      }

      if (imageResizeConfig.trimOptions) {
        resized = resized.trim(imageResizeConfig.trimOptions);
      }

      const { data: bufferData, info: bufferInfo } = await resized.toBuffer({
        resolveWithObject: true,
      });

      const sanitizedImage = getSanitizedImageData(savedFilename);

      if (req.payloadUploadSizes) {
        req.payloadUploadSizes[imageResizeConfig.name] = bufferData;
      }

      const mimeInfo = await fromBuffer(bufferData);

      const imageNameWithDimensions = createImageName(
        sanitizedImage.name,
        bufferInfo,
        mimeInfo?.ext || sanitizedImage.ext,
      );

      const imagePath = `${staticPath}/${imageNameWithDimensions}`;

      if (await fileExists(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      const { width, height, size } = bufferInfo;
      return createResult(
        imageResizeConfig.name,
        imageNameWithDimensions,
        width,
        height,
        size,
        mimeInfo?.mime || mimeType,
        [{ path: imagePath, buffer: bufferData }],
      );
    }),
  );

  return results.reduce(
    (acc, result) => {
      Object.assign(acc.sizeData, result.sizeData);
      acc.sizesToSave.push(...result.sizesToSave);
      return acc;
    },
    { sizeData: {}, sizesToSave: [] },
  );
}
