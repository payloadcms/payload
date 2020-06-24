const fs = require('fs');
const sharp = require('sharp');
const sanitize = require('sanitize-filename');
const { promisify } = require('util');
const imageSize = require('image-size');
const fileExists = require('./fileExists');

const sizeOf = promisify(imageSize);

function getOutputImage(sourceImage, size) {
  const extension = sourceImage.split('.').pop();
  const name = sanitize(sourceImage.substr(0, sourceImage.lastIndexOf('.')) || sourceImage);

  return {
    name,
    extension,
    width: size.width,
    height: size.height,
  };
}

module.exports = async function resizeAndSave(config, savedFilename, mimeType) {
  /**
   * Resize images according to image desired width and height and return sizes
   * @param config Object
   * @param uploadConfig Object
   * @param savedFilename String
   * @returns String[]
   */

  const { imageSizes, staticDir } = config.upload;

  const sourceImage = `${staticDir}/${savedFilename}`;
  let sizes;
  try {
    const dimensions = await sizeOf(sourceImage);
    sizes = imageSizes
      .filter(desiredSize => desiredSize.width < dimensions.width)
      .map(async (desiredSize) => {
        const outputImage = getOutputImage(savedFilename, desiredSize);
        const imageNameWithDimensions = `${outputImage.name}-${outputImage.width}x${outputImage.height}.${outputImage.extension}`;
        const imagePath = `${staticDir}/${imageNameWithDimensions}`;
        const fileAlreadyExists = await fileExists(imagePath);

        if (fileAlreadyExists) {
          fs.unlinkSync(imagePath);
        }

        const output = await sharp(sourceImage)
          .resize(desiredSize.width, desiredSize.height, {
            position: desiredSize.crop || 'centre',
          })
          .toFile(imagePath);

        return {
          ...desiredSize,
          filename: imageNameWithDimensions,
          filesize: output.size,
          mimeType,
        };
      });

    const savedSizes = await Promise.all(sizes);

    return savedSizes.reduce((results, size) => {
      return {
        ...results,
        [size.name]: {
          width: size.width,
          height: size.height,
          filename: size.filename,
          mimeType: size.mimeType,
          filesize: size.filesize,
        },
      };
    }, {});
  } catch (e) {
    throw e;
  }
};
