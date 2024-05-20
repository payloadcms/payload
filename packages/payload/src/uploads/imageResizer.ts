import type { UploadedFile } from 'express-fileupload'
import type { OutputInfo } from 'sharp'

import { fromBuffer } from 'file-type'
import fs from 'fs'
import sanitize from 'sanitize-filename'
import sharp from 'sharp'

import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { PayloadRequest } from '../express/types'
import type {
  FileSize,
  FileSizes,
  FileToSave,
  ImageSize,
  ProbedImageSize,
  UploadEdits,
} from './types'

import { isNumber } from '../utilities/isNumber'
import fileExists from './fileExists'

type ResizeArgs = {
  config: SanitizedCollectionConfig
  dimensions: ProbedImageSize
  file: UploadedFile
  mimeType: string
  req: PayloadRequest
  savedFilename: string
  staticPath: string
  uploadEdits?: UploadEdits
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
const createImageName = (
  outputImageName: string,
  { height, width }: OutputInfo,
  extension: string,
) => `${outputImageName}-${width}x${height}.${extension}`

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
 * Check if the image needs to be resized according to the requested dimensions
 * and the original image size. If the resize options withoutEnlargement or withoutReduction are provided,
 * the image will be resized regardless of the requested dimensions, given that the
 * width or height to be resized is provided.
 *
 * @param resizeConfig - object containing the requested dimensions and resize options
 * @param original - the original image size
 * @returns true if resizing is not needed, false otherwise
 */
const preventResize = (
  { height: desiredHeight, width: desiredWidth, withoutEnlargement, withoutReduction }: ImageSize,
  original: ProbedImageSize,
): boolean => {
  // default is to allow reduction
  if (withoutReduction !== undefined) {
    return false // needs resize
  }

  // default is to prevent enlargement
  if (withoutEnlargement !== undefined) {
    return false // needs resize
  }

  const isWidthOrHeightNotDefined = !desiredHeight || !desiredWidth
  if (isWidthOrHeightNotDefined) {
    // If width and height are not defined, it means there is a format conversion
    // and the image needs to be "resized" (transformed).
    return false // needs resize
  }

  const hasInsufficientWidth = desiredWidth > original.width
  const hasInsufficientHeight = desiredHeight > original.height
  if (hasInsufficientWidth && hasInsufficientHeight) {
    // doesn't need resize - prevent enlargement. This should only happen if both width and height are insufficient.
    // if only one dimension is insufficient and the other is sufficient, resizing needs to happen, as the image
    // should be resized to the sufficient dimension.
    return true // do not create a new size
  }

  return false // needs resize
}

/**
 * Check if the image should be passed directly to sharp without payload adjusting properties.
 *
 * @param resizeConfig - object containing the requested dimensions and resize options
 * @param original - the original image size
 * @returns true if the image should passed directly to sharp
 */
const applyPayloadAdjustments = (
  { fit, height, width, withoutEnlargement, withoutReduction }: ImageSize,
  original: ProbedImageSize,
) => {
  if (fit === 'contain' || fit === 'inside') return false
  if (!isNumber(height) && !isNumber(width)) return false

  const targetAspectRatio = width / height
  const originalAspectRatio = original.width / original.height
  if (originalAspectRatio === targetAspectRatio) return false

  const skipEnlargement = withoutEnlargement && (original.height < height || original.width < width)
  const skipReduction = withoutReduction && (original.height > height || original.width > width)
  if (skipEnlargement || skipReduction) return false

  return true
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
 * For the provided image sizes, handle the resizing and the transforms
 * (format, trim, etc.) of each requested image size and return the result object.
 * This only handles the image sizes. The transforms of the original image
 * are handled in {@link ./generateFileData.ts}.
 *
 * The image will be resized according to the provided
 * resize config. If no image sizes are requested, the resolved data will be empty.
 * For every image that dos not need to be resized, an result object with `null`
 * parameters will be returned.
 *
 * @param resizeConfig - the resize config
 * @returns the result of the resize operation(s)
 */
export default async function resizeAndTransformImageSizes({
  config,
  dimensions,
  file,
  mimeType,
  req,
  savedFilename,
  staticPath,
  uploadEdits,
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

  // Nothing to resize here so return as early as possible
  if (!imageSizes) return defaultResult

  const sharpBase = sharp(file.tempFilePath || file.data).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081

  const results: ImageSizesResult[] = await Promise.all(
    imageSizes.map(async (imageResizeConfig): Promise<ImageSizesResult> => {
      imageResizeConfig = sanitizeResizeConfig(imageResizeConfig)

      // This checks if a resize should happen. If not, the resized image will be
      // skipped COMPLETELY and thus will not be included in the resulting images.
      // All further format/trim options will thus be skipped as well.
      if (preventResize(imageResizeConfig, dimensions)) {
        return createResult({ name: imageResizeConfig.name })
      }

      const imageToResize = sharpBase.clone()
      let resized = imageToResize

      if (incomingFocalPoint && applyPayloadAdjustments(imageResizeConfig, dimensions)) {
        const { height: resizeHeight, width: resizeWidth } = imageResizeConfig
        const resizeAspectRatio = resizeWidth / resizeHeight
        const originalAspectRatio = dimensions.width / dimensions.height
        const prioritizeHeight = resizeAspectRatio < originalAspectRatio

        // Scale the image up or down to fit the resize dimensions
        const scaledImage = imageToResize.resize({
          height: prioritizeHeight ? resizeHeight : null,
          width: prioritizeHeight ? null : resizeWidth,
        })
        const { info: scaledImageInfo } = await scaledImage.toBuffer({ resolveWithObject: true })

        const safeResizeWidth = resizeWidth ?? scaledImageInfo.width
        const maxOffsetX = scaledImageInfo.width - safeResizeWidth
        const leftFocalEdge = Math.round(
          scaledImageInfo.width * (incomingFocalPoint.x / 100) - safeResizeWidth / 2,
        )
        const safeOffsetX = Math.min(Math.max(0, leftFocalEdge), maxOffsetX)

        const safeResizeHeight = resizeHeight ?? scaledImageInfo.height
        const maxOffsetY = scaledImageInfo.height - safeResizeHeight
        const topFocalEdge = Math.round(
          scaledImageInfo.height * (incomingFocalPoint.y / 100) - safeResizeHeight / 2,
        )
        const safeOffsetY = Math.min(Math.max(0, topFocalEdge), maxOffsetY)

        // extract the focal area from the scaled image
        resized = scaledImage.extract({
          height: safeResizeHeight,
          left: safeOffsetX,
          top: safeOffsetY,
          width: safeResizeWidth,
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

      const { data: bufferData, info: bufferInfo } = await resized.toBuffer({
        resolveWithObject: true,
      })

      const sanitizedImage = getSanitizedImageData(savedFilename)

      if (req.payloadUploadSizes) {
        req.payloadUploadSizes[imageResizeConfig.name] = bufferData
      }

      const mimeInfo = await fromBuffer(bufferData)

      const imageNameWithDimensions = createImageName(
        sanitizedImage.name,
        bufferInfo,
        mimeInfo?.ext || sanitizedImage.ext,
      )

      const imagePath = `${staticPath}/${imageNameWithDimensions}`

      if (await fileExists(imagePath)) {
        try {
          fs.unlinkSync(imagePath)
        } catch {
          // Ignore unlink errors
        }
      }

      const { height, size, width } = bufferInfo
      return createResult({
        name: imageResizeConfig.name,
        filename: imageNameWithDimensions,
        filesize: size,
        height,
        mimeType: mimeInfo?.mime || mimeType,
        sizesToSave: [{ buffer: bufferData, path: imagePath }],
        width,
      })
    }),
  )

  return results.reduce((acc, result) => {
    Object.assign(acc.sizeData, result.sizeData)
    acc.sizesToSave.push(...result.sizesToSave)
    return acc
  }, defaultResult)
}
