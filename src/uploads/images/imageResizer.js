import sharp from 'sharp';
import { promisify } from 'util';
import imageSize from 'image-size';

const sizeOf = promisify(imageSize);

function getOutputImageName(sourceImage, size) {
  const extension = sourceImage.split('.')
    .pop();
  const filenameWithoutExtension = sourceImage.substr(0, sourceImage.lastIndexOf('.')) || sourceImage;
  return `${filenameWithoutExtension}-${size.width}x${size.height}.${extension}`;
}

export async function resizeAndSave(config, uploadConfig, file) {
  console.log(uploadConfig);
  const sourceImage = `${config.staticDir}/${file.name}`;

  const outputSizes = [];
  try {
    const dimensions = await sizeOf(sourceImage);
    for (const desiredSize of uploadConfig.imageSizes) {
      if (desiredSize.width > dimensions.width) {
        continue;
      }
      let outputImageName = getOutputImageName(sourceImage, desiredSize);
      await sharp(sourceImage)
        .resize(desiredSize.width, desiredSize.height, {
          position: desiredSize.crop || 'centre' // would it make sense for this to be set by the uploader?
        })
        .toFile(outputImageName);
      outputSizes.push({
        name: desiredSize.name,
        height: desiredSize.height,
        width: desiredSize.width
      });
    }
  } catch (e) {
    console.log('error in resize and save', e.message);
  }
  return outputSizes;
}
