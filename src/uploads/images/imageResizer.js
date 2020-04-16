const sharp = require('sharp');
const sanitize = require('sanitize-filename');
const { promisify } = require('util');
const imageSize = require('image-size');

const sizeOf = promisify(imageSize);

function getOutputImageName(sourceImage, size) {
  const extension = sourceImage.split('.').pop();
  const filenameWithoutExtension = sanitize(sourceImage.substr(0, sourceImage.lastIndexOf('.')) || sourceImage);
  return `${filenameWithoutExtension}-${size.width}x${size.height}.${extension}`;
}

module.exports = async function resizeAndSave(config, uploadConfig, file) {
  /**
   * Resize images according to image desired width and height and return sizes
   * @param config
   * @param uploadConfig
   * @param file
   * @returns String[]
   */

  const sourceImage = `${config.staticDir}/${file.name}`;
  let sizes;
  try {
    const dimensions = await sizeOf(sourceImage);
    sizes = uploadConfig.imageSizes
      .filter(desiredSize => desiredSize.width < dimensions.width)
      .map(async (desiredSize) => {
        const outputImageName = getOutputImageName(sourceImage, desiredSize);
        await sharp(sourceImage)
          .resize(desiredSize.width, desiredSize.height, {
            // would it make sense for this to be set by the uploader?
            position: desiredSize.crop || 'centre',
          })
          .toFile(outputImageName);
        return { ...desiredSize };
      });
  } catch (e) {
    console.log('error in resize and save', e.message);
  }

  return Promise.all(sizes);
};
