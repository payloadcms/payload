import type { ImageSize, ProbedImageSize } from '../types.js'

import { isNumber } from '../../utilities/isNumber.js'

/**
 * Determine whether or not to resize the image.
 * - resize using image config
 * - resize using image config with focal adjustments
 * - do not resize at all
 *
 * `imageResizeConfig.withoutEnlargement`:
 * - undefined [default]: uploading images with smaller width AND height than the image size will return null
 * - false: always enlarge images to the image size
 * - true: if the image is smaller than the image size, return the original image
 *
 * `imageResizeConfig.withoutReduction`:
 * - false [default]: always enlarge images to the image size
 * - true: if the image is smaller than the image size, return the original image
 *
 * @return 'omit' | 'resize' | 'resizeWithFocalPoint'
 */
export const getImageResizeAction = ({
  dimensions: originalImage,
  hasFocalPoint,
  imageResizeConfig,
}: {
  dimensions: ProbedImageSize
  hasFocalPoint?: boolean
  imageResizeConfig: ImageSize
}): 'omit' | 'resize' | 'resizeWithFocalPoint' => {
  const { fit, withoutEnlargement, withoutReduction } = imageResizeConfig
  const targetWidth = imageResizeConfig.width!
  const targetHeight = imageResizeConfig.height!

  // prevent upscaling by default when x and y are both smaller than target image size
  if (targetHeight && targetWidth) {
    const originalImageIsSmallerXAndY =
      originalImage.width < targetWidth && originalImage.height < targetHeight
    if (withoutEnlargement === undefined && originalImageIsSmallerXAndY) {
      return 'omit' // prevent image size from being enlarged
    }
  }

  if (withoutEnlargement === undefined && (!targetWidth || !targetHeight)) {
    if (
      (targetWidth && originalImage.width < targetWidth) ||
      (targetHeight && originalImage.height < targetHeight)
    ) {
      return 'omit'
    }
  }

  const originalImageIsSmallerXOrY =
    originalImage.width < targetWidth || originalImage.height < targetHeight
  if (fit === 'contain' || fit === 'inside') {
    return 'resize'
  }
  if (!isNumber(targetHeight) && !isNumber(targetWidth)) {
    return 'resize'
  }

  const targetAspectRatio = targetWidth / targetHeight
  const originalAspectRatio = originalImage.width / originalImage.height
  if (originalAspectRatio === targetAspectRatio) {
    return 'resize'
  }

  if (withoutEnlargement && originalImageIsSmallerXOrY) {
    return 'resize'
  }
  if (withoutReduction && !originalImageIsSmallerXOrY) {
    return 'resize'
  }

  return hasFocalPoint ? 'resizeWithFocalPoint' : 'resize'
}
