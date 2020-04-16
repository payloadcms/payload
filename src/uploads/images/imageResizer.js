/* eslint-disable func-names */
const sharp = require('sharp');
const sanitize = require('sanitize-filename');
const { promisify } = require('util');
const imageSize = require('image-size');
const fs = require('fs');

const stat = promisify(fs.stat);
const sizeOf = promisify(imageSize);

function getOutputImage(sourceImage, size) {
  const extension = sourceImage.split('.').pop();
  const name = sanitize(sourceImage.substr(0, sourceImage.lastIndexOf('.')) || sourceImage);

  return {
    name,
    extension,
    width: size.width,
    height: size.height,
    formatted() { return `${this.name}-${this.width}x${this.height}.${this.extension}`; },
    incrementName() {
      const regex = /(.*)-(\d)$/;
      const found = this.name.match(regex);
      if (found === null) {
        this.name += '-1';
      } else {
        const matchedName = found[1];
        const matchedNumber = found[2];
        const incremented = Number(matchedNumber) + 1;
        const newName = `${matchedName}-${incremented}`;
        this.name = newName;
      }
    },
  };
}

const getFileSystemSafeFileName = async (outputImage) => {
  const exists = async (fileName) => {
    try {
      await stat(fileName);
      return true;
    } catch (err) {
      return false;
    }
  };
  // eslint-disable-next-line no-await-in-loop
  while (await exists(outputImage.formatted())) {
    outputImage.incrementName();
  }
  return outputImage.formatted();
};

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
        let outputImage = getOutputImage(sourceImage, desiredSize);
        outputImage = await getFileSystemSafeFileName(outputImage);
        await sharp(sourceImage)
          .resize(desiredSize.width, desiredSize.height, {
            // would it make sense for this to be set by the uploader?
            position: desiredSize.crop || 'centre',
          })
          .toFile(outputImage.formatted());
        return { ...desiredSize };
      });
  } catch (e) {
    console.log('error in resize and save', e.message);
  }

  return Promise.all(sizes);
};
