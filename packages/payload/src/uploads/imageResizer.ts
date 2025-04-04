// @ts-strict-ignore
import type { Sharp, Metadata as SharpMetadata, SharpOptions } from 'sharp'

import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import sanitize from 'sanitize-filename'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SharpDependency } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { WithMetadata } from './optionallyAppendMetadata.js'
import type {
  FileSize,
  FileSizes,
  FileToSave,
  ImageSize,
  ProbedImageSize,
  UploadEdits,
} from './types.js'

import { isNumber } from '../utilities/isNumber.js'
import fileExists from './fileExists.js'
import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'

type ResizeArgs = {
  config: SanitizedCollectionConfig
  dimensions: ProbedImageSize
  file: PayloadRequest['file']
  mimeType: string
  req: PayloadRequest
  savedFilename: string
  sharp?: SharpDependency
  staticPath: string
  uploadEdits?: UploadEdits
  withMetadata?: WithMetadata
}

/** Result from resizing and transforming the requested image sizes */
type ImageSizesResult = {
  focalPoint?: UploadEdits['focalPoint']
  sizeData: FileSizes
  sizesToSave: FileToSave[]
}

type SanitizedImageData = {
  ext: string
  name: string
}

/**
 * Sanitize the image name and extract the extension from the source image
 *
 * @param sourceImage - the source image
 * @returns the sanitized name and extension
 */
const getSanitizedImageData = (sourceImage: string): SanitizedImageData => {
  const extension = sourceImage.split('.').pop()
  const name = sanitize(sourceImage.substring(0, sourceImage.lastIndexOf('.')) || sourceImage)
  return { name, ext: extension }
}

/**
 * Create a new image name based on the output image name, the dimensions and
 * the extension.
 *
 * Ignore the fact that duplicate names could happen if the there is one
 * size with `width AND height` and one with only `height OR width`. Because
 * space is expensive, we will reuse the same image for both sizes.
 *
 * @param outputImageName - the sanitized image name
 * @param bufferInfo - the buffer info
 * @param extension - the extension to use
 * @returns the new image name that is not taken
 */
type CreateImageNameArgs = {
  extension: string
  height: number
  outputImageName: string
  width: number
}
const createImageName = ({
  extension,
  height,
  outputImageName,
  width,
}: CreateImageNameArgs): string => {
  return `${outputImageName}-${width}x${height}.${extension}`
}

type CreateResultArgs = {
  filename?: FileSize['filename']
  filesize?: FileSize['filesize']
  height?: FileSize['height']
  mimeType?: FileSize['mimeType']
  name: string
  sizesToSave?: FileToSave[]
  width?: FileSize['width']
}

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
const createResult = ({
  name,
  filename = null,
  filesize = null,
  height = null,
  mimeType = null,
  sizesToSave = [],
  width = null,
}: CreateResultArgs): ImageSizesResult => {
  return {
    sizeData: {
      [name]: {
        filename,
        filesize,
        height,
        mimeType,
        width,
      },
    },
    sizesToSave,
  }
}

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
const getImageResizeAction = ({
  dimensions: originalImage,
  hasFocalPoint,
  imageResizeConfig,
}: {
  dimensions: ProbedImageSize
  hasFocalPoint?: boolean
  imageResizeConfig: ImageSize
}): 'omit' | 'resize' | 'resizeWithFocalPoint' => {
  const {
    fit,
    height: targetHeight,
    width: targetWidth,
    withoutEnlargement,
    withoutReduction,
  } = imageResizeConfig

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

/**
 * Sanitize the resize config. If the resize config has the `withoutReduction`
 * property set to true, the `fit` and `position` properties will be set to `contain`
 * and `top left` respectively.
 *
 * @param resizeConfig - the resize config
 * @returns a sanitized resize config
 */
const sanitizeResizeConfig = (resizeConfig: ImageSize): ImageSize => {
  if (resizeConfig.withoutReduction) {
    return {
      ...resizeConfig,
      // Why fit `contain` should also be set to https://github.com/lovell/sharp/issues/3595
      fit: resizeConfig?.fit || 'contain',
      position: resizeConfig?.position || 'left top',
    }
  }
  return resizeConfig
}

/**
 * Used to extract height from images, animated or not.
 *
 * @param sharpMetadata - the sharp metadata
 * @returns the height of the image
 */
function extractHeightFromImage(sharpMetadata: SharpMetadata): number {
  if (sharpMetadata?.pages) {
    return sharpMetadata.height / sharpMetadata.pages
  }
  return sharpMetadata.height
}

/**
 * For the provided image sizes, handle the resizing and the transforms
 * (format, trim, etc.) of each requested image size and return the result object.
 * This only handles the image sizes. The transforms of the original image
 * are handled in {@link ./generateFileData.ts}.
 *
 * The image will be resized according to the provided
 * resize config. If no image sizes are requested, the resolved data will be empty.
 * For every image that does not need to be resized, a result object with `null`
 * parameters will be returned.
 *
 * @param resizeConfig - the resize config
 * @returns the result of the resize operation(s)
 */
export async function resizeAndTransformImageSizes({
  config,
  dimensions,
  file,
  mimeType,
  req,
  savedFilename,
  sharp,
  staticPath,
  uploadEdits,
  withMetadata,
}: ResizeArgs): Promise<ImageSizesResult> {
  const { focalPoint: focalPointEnabled = true, imageSizes } = config.upload

  // Focal point adjustments
  const incomingFocalPoint = uploadEdits.focalPoint
    ? {
        x: isNumber(uploadEdits.focalPoint.x) ? Math.round(uploadEdits.focalPoint.x) : 50,
        y: isNumber(uploadEdits.focalPoint.y) ? Math.round(uploadEdits.focalPoint.y) : 50,
      }
    : undefined

  const defaultResult: ImageSizesResult = {
    ...(focalPointEnabled && incomingFocalPoint && { focalPoint: incomingFocalPoint }),
    sizeData: {},
    sizesToSave: [],
  }

  if (!imageSizes || !sharp) {
    return defaultResult
  }

  // Determine if the file is animated
  const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)
  const sharpOptions: SharpOptions = {}

  if (fileIsAnimatedType) {
    sharpOptions.animated = true
  }

  const sharpBase: Sharp | undefined = sharp(file.tempFilePath || file.data, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
  const originalImageMeta = await sharpBase.metadata()

  let adjustedDimensions = { ...dimensions }

  // Images with an exif orientation of 5, 6, 7, or 8 are auto-rotated by sharp
  // Need to adjust the dimensions to match the original image
  if ([5, 6, 7, 8].includes(originalImageMeta.orientation)) {
    adjustedDimensions = {
      ...dimensions,
      height: dimensions.width,
      width: dimensions.height,
    }
  }

  const resizeImageMeta = {
    height: extractHeightFromImage(originalImageMeta),
    width: originalImageMeta.width,
  }

  const results: ImageSizesResult[] = await Promise.all(
    imageSizes.map(async (imageResizeConfig): Promise<ImageSizesResult> => {
      imageResizeConfig = sanitizeResizeConfig(imageResizeConfig)

      const resizeAction = getImageResizeAction({
        dimensions,
        hasFocalPoint: Boolean(incomingFocalPoint),
        imageResizeConfig,
      })
      if (resizeAction === 'omit') {
        return createResult({ name: imageResizeConfig.name })
      }

      const imageToResize = sharpBase.clone()
      let resized = imageToResize

      if (resizeAction === 'resizeWithFocalPoint') {
        let { height: resizeHeight, width: resizeWidth } = imageResizeConfig

        const originalAspectRatio = adjustedDimensions.width / adjustedDimensions.height

        // Calculate resizeWidth based on original aspect ratio if it's undefined
        if (resizeHeight && !resizeWidth) {
          resizeWidth = Math.round(resizeHeight * originalAspectRatio)
        }

        // Calculate resizeHeight based on original aspect ratio if it's undefined
        if (resizeWidth && !resizeHeight) {
          resizeHeight = Math.round(resizeWidth / originalAspectRatio)
        }

        if (!resizeHeight) {
          resizeHeight = resizeImageMeta.height
        }
        if (!resizeWidth) {
          resizeWidth = resizeImageMeta.width
        }

        const resizeAspectRatio = resizeWidth / resizeHeight
        const prioritizeHeight = resizeAspectRatio < originalAspectRatio
        // Scales the image before extracting from it
        resized = imageToResize.resize({
          fastShrinkOnLoad: false,
          height: prioritizeHeight ? resizeHeight : undefined,
          width: prioritizeHeight ? undefined : resizeWidth,
        })

        const metadataAppendedFile = await optionallyAppendMetadata({
          req,
          sharpFile: resized,
          withMetadata,
        })

        // Must read from buffer, resized.metadata will return the original image metadata
        const { info } = await metadataAppendedFile.toBuffer({ resolveWithObject: true })

        resizeImageMeta.height = extractHeightFromImage({
          ...originalImageMeta,
          height: info.height,
        })
        resizeImageMeta.width = info.width

        const halfResizeX = resizeWidth / 2
        const xFocalCenter = resizeImageMeta.width * (incomingFocalPoint.x / 100)
        const calculatedRightPixelBound = xFocalCenter + halfResizeX
        let leftBound = xFocalCenter - halfResizeX

        // if the right bound is greater than the image width, adjust the left bound
        // keeping focus on the right
        if (calculatedRightPixelBound > resizeImageMeta.width) {
          leftBound = resizeImageMeta.width - resizeWidth
        }

        // if the left bound is less than 0, adjust the left bound to 0
        // keeping the focus on the left
        if (leftBound < 0) {
          leftBound = 0
        }

        const halfResizeY = resizeHeight / 2
        const yFocalCenter = resizeImageMeta.height * (incomingFocalPoint.y / 100)
        const calculatedBottomPixelBound = yFocalCenter + halfResizeY
        let topBound = yFocalCenter - halfResizeY

        // if the bottom bound is greater than the image height, adjust the top bound
        // keeping the image as far right as possible
        if (calculatedBottomPixelBound > resizeImageMeta.height) {
          topBound = resizeImageMeta.height - resizeHeight
        }

        // if the top bound is less than 0, adjust the top bound to 0
        // keeping the image focus near the top
        if (topBound < 0) {
          topBound = 0
        }

        resized = resized.extract({
          height: resizeHeight,
          left: Math.floor(leftBound),
          top: Math.floor(topBound),
          width: resizeWidth,
        })
      } else {
        resized = imageToResize.resize(imageResizeConfig)
      }

      if (imageResizeConfig.formatOptions) {
        resized = resized.toFormat(
          imageResizeConfig.formatOptions.format,
          imageResizeConfig.formatOptions.options,
        )
      }

      if (imageResizeConfig.trimOptions) {
        resized = resized.trim(imageResizeConfig.trimOptions)
      }

      const metadataAppendedFile = await optionallyAppendMetadata({
        req,
        sharpFile: resized,
        withMetadata,
      })

      const { data: bufferData, info: bufferInfo } = await metadataAppendedFile.toBuffer({
        resolveWithObject: true,
      })

      const sanitizedImage = getSanitizedImageData(savedFilename)

      if (req.payloadUploadSizes) {
        req.payloadUploadSizes[imageResizeConfig.name] = bufferData
      }

      const mimeInfo = await fileTypeFromBuffer(bufferData)

      const imageNameWithDimensions = imageResizeConfig.generateImageName
        ? imageResizeConfig.generateImageName({
            extension: mimeInfo?.ext || sanitizedImage.ext,
            height: extractHeightFromImage({
              ...originalImageMeta,
              height: bufferInfo.height,
            }),
            originalName: sanitizedImage.name,
            sizeName: imageResizeConfig.name,
            width: bufferInfo.width,
          })
        : createImageName({
            extension: mimeInfo?.ext || sanitizedImage.ext,
            height: extractHeightFromImage({
              ...originalImageMeta,
              height: bufferInfo.height,
            }),
            outputImageName: sanitizedImage.name,
            width: bufferInfo.width,
          })

      const imagePath = `${staticPath}/${imageNameWithDimensions}`

      if (await fileExists(imagePath)) {
        try {
          await fs.unlink(imagePath)
        } catch {
          // Ignore unlink errors
        }
      }

      const { height, size, width } = bufferInfo
      return createResult({
        name: imageResizeConfig.name,
        filename: imageNameWithDimensions,
        filesize: size,
        height:
          fileIsAnimatedType && originalImageMeta.pages ? height / originalImageMeta.pages : height,
        mimeType: mimeInfo?.mime || mimeType,
        sizesToSave: [{ buffer: bufferData, path: imagePath }],
        width,
      })
    }),
  )

  return results.reduce(
    (acc, result) => {
      Object.assign(acc.sizeData, result.sizeData)
      acc.sizesToSave.push(...result.sizesToSave)
      return acc
    },
    { ...defaultResult },
  )
}
