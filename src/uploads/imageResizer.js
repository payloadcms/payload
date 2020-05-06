/* eslint-disable func-names */
const sharp = require('sharp');
const sanitize = require('sanitize-filename');
const { promisify } = require('util');
const imageSize = require('image-size');

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

module.exports = async function resizeAndSave(config, savedFilename) {
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
        await sharp(sourceImage)
          .resize(desiredSize.width, desiredSize.height, {
            // would it make sense for this to be set by the uploader?
            position: desiredSize.crop || 'centre',
          })
          .toFile(`${staticDir}/${imageNameWithDimensions}`);
        return { ...desiredSize, filename: imageNameWithDimensions };
      });
    const savedSizes = await Promise.all(sizes);
    return savedSizes.reduce((results, size) => {
      return {
        ...results,
        [size.name]: {
          width: size.width,
          height: size.height,
          filename: size.filename,
        },
      };
    }, {});
  } catch (e) {
    throw e;
  }
};
