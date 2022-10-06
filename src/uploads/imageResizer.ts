import { fromBuffer } from 'file-type';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import sharp from 'sharp';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { PayloadRequest } from '../express/types';
import fileExists from './fileExists';
import { ProbedImageSize } from './getImageSize';
import { FileSizes, FileToSave, ImageSize } from './types';

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

type Result = Promise<{
  sizeData: FileSizes
  sizesToSave: FileToSave[]
}>

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

export default async function resizeAndSave({
  req,
  file,
  dimensions,
  staticPath,
  config,
  savedFilename,
}: Args): Promise<Result> {
  const { imageSizes } = config.upload;
  const sizesToSave: FileToSave[] = [];

  const sizes = imageSizes
    .filter((desiredSize) => needsResize(desiredSize, dimensions))
    .map(async (desiredSize) => {
      let resized = sharp(file).resize(desiredSize);

      if (desiredSize.formatOptions) {
        resized = resized.toFormat(desiredSize.formatOptions.format, desiredSize.formatOptions.options);
      }

      const bufferObject = await resized.toBuffer({
        resolveWithObject: true,
      });

      req.payloadUploadSizes[desiredSize.name] = bufferObject.data;

      const outputImage = getOutputImage(savedFilename, desiredSize);
      const imageNameWithDimensions = createImageName(outputImage, bufferObject);
      const imagePath = `${staticPath}/${imageNameWithDimensions}`;
      const fileAlreadyExists = await fileExists(imagePath);

      if (fileAlreadyExists) {
        fs.unlinkSync(imagePath);
      }

      sizesToSave.push({
        path: imagePath,
        buffer: bufferObject.data,
      });

      return {
        name: desiredSize.name,
        width: bufferObject.info.width,
        height: bufferObject.info.height,
        filename: imageNameWithDimensions,
        filesize: bufferObject.info.size,
        mimeType: (await fromBuffer(bufferObject.data)).mime,
      };
    });

  const savedSizes = await Promise.all(sizes);

  return {
    sizeData: savedSizes.reduce(
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
    ),
    sizesToSave,
  };
}
function createImageName(
  outputImage: OutputImage,
  bufferObject: { data: Buffer; info: sharp.OutputInfo },
): string {
  return `${outputImage.name}-${bufferObject.info.width}x${bufferObject.info.height}.${outputImage.extension}`;
}

function needsResize(desiredSize: ImageSize, dimensions: ProbedImageSize): boolean {
  return (typeof desiredSize.width === 'number' && desiredSize.width <= dimensions.width)
    || (typeof desiredSize.height === 'number' && desiredSize.height <= dimensions.height);
}
