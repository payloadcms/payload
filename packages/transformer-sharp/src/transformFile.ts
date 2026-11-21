import type {
  Crop,
  Document,
  PayloadRequest,
  TransformFileArgs,
  TransformFileResult,
} from 'payload'
import type { ResizeOptions, SharpOptions } from 'sharp'

import type { SharpDependency, SharpUploadTaskOptions } from './types.js'

import { createSharpFromFile } from './createSharpFromFile.js'
import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'
import { getSavedCrop, getSavedFocalPoint } from './readSavedTransforms.js'

const ANIMATED_MIME_TYPES = ['image/avif', 'image/gif', 'image/webp']

/**
 * The Sharp package's public one-file-in/one-file-out upload primitive.
 * `options.kind` selects which legacy task to run: the main file (cropped by the
 * crop saved in `doc._transforms`, with `resizeOptions` re-applied to the crop
 * output), or one named legacy image size. Never writes to storage.
 */
export function createTransformFile({ sharpDependency }: { sharpDependency: SharpDependency }) {
  return async function transformFile({
    doc,
    file,
    options,
    req,
  }: TransformFileArgs<SharpUploadTaskOptions>): Promise<TransformFileResult> {
    if (options.kind === 'main') {
      return transformMain({ doc, file, options, req, sharpDependency })
    }

    return transformSize({ doc, file, options, req, sharpDependency })
  }
}

async function transformMain({
  doc,
  file,
  options,
  req,
  sharpDependency,
}: {
  doc: Document
  file: File
  options: Extract<SharpUploadTaskOptions, { kind: 'main' }>
  req: PayloadRequest
  sharpDependency: SharpDependency
}): Promise<TransformFileResult> {
  const { collectionUpload, cropSize, originalDimensions } = options
  // A full-image selection saves no crop, but a request crop size still extracts from the corner.
  const crop = getSavedCrop({ doc }) ?? (cropSize ? { ...cropSize, x: 0, y: 0 } : undefined)
  const {
    constructorOptions,
    formatOptions,
    maxInputPixels,
    resizeOptions,
    trimOptions,
    withMetadata,
  } = collectionUpload

  const fileIsAnimatedType = ANIMATED_MIME_TYPES.includes(file.type)
  const fileHasAdjustments = Boolean(
    resizeOptions || formatOptions || trimOptions || constructorOptions,
  )

  if (crop && originalDimensions) {
    return transformCrop({
      constructorOptions,
      crop,
      cropSize,
      file,
      fileIsAnimatedType,
      maxInputPixels,
      originalDimensions,
      req,
      resizeOptions,
      sharpDependency,
      withMetadata,
    })
  }

  if (!fileIsAnimatedType && !fileHasAdjustments) {
    return { status: 'continue' }
  }

  const sharpOptions: SharpOptions = { ...constructorOptions }

  if (fileIsAnimatedType) {
    sharpOptions.animated = true
  }

  // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
  let sharpFile = (
    await createSharpFromFile({ file, maxInputPixels, options: sharpOptions, sharpDependency })
  ).rotate()

  if (resizeOptions) {
    sharpFile = sharpFile.resize(resizeOptions)
  }
  if (formatOptions) {
    sharpFile = sharpFile.toFormat(formatOptions.format, formatOptions.options)
  }
  if (trimOptions) {
    sharpFile = sharpFile.trim(trimOptions)
  }

  sharpFile = await optionallyAppendMetadata({ req, sharpFile, withMetadata })
  const { data: outputData } = await sharpFile.toBuffer({ resolveWithObject: true })

  return {
    file: new File([outputData], file.name, { type: file.type }),
    status: 'continue',
  }
}

async function transformCrop({
  constructorOptions,
  crop,
  cropSize,
  file,
  fileIsAnimatedType,
  maxInputPixels,
  originalDimensions,
  req,
  resizeOptions,
  sharpDependency,
  withMetadata,
}: {
  constructorOptions: Extract<
    SharpUploadTaskOptions,
    { kind: 'main' }
  >['collectionUpload']['constructorOptions']
  crop: Omit<Crop, 'unit'>
  cropSize: Extract<SharpUploadTaskOptions, { kind: 'main' }>['cropSize']
  file: File
  fileIsAnimatedType: boolean
  maxInputPixels: number | undefined
  originalDimensions: { height: number; width: number }
  req: PayloadRequest
  resizeOptions: ResizeOptions | undefined
  sharpDependency: SharpDependency
  withMetadata: SharpUploadTaskOptions['collectionUpload']['withMetadata']
}): Promise<TransformFileResult> {
  // `constructorOptions` used to reach only the main file; a crop decodes the same
  // source, so it gets the same options (and the same input-pixel cap).
  const sharpOptions: SharpOptions = { ...constructorOptions }

  if (fileIsAnimatedType) {
    sharpOptions.animated = true
  }

  const newWidth = Number(cropSize?.width ?? crop.width)
  const newHeight = Number(cropSize?.height ?? crop.height)
  const dimensionsChanged =
    originalDimensions.width !== newWidth || originalDimensions.height !== newHeight

  let croppedFile = file

  if (dimensionsChanged) {
    const formattedCropData = {
      height: newHeight,
      // A request crop size larger than the saved crop could pass the far edge.
      left: Math.min(crop.x, originalDimensions.width - newWidth),
      top: Math.min(crop.y, originalDimensions.height - newHeight),
      width: newWidth,
    }

    let cropped = (
      await createSharpFromFile({ file, maxInputPixels, options: sharpOptions, sharpDependency })
    ).extract(formattedCropData)
    cropped = await optionallyAppendMetadata({ req, sharpFile: cropped, withMetadata })
    const { data } = await cropped.toBuffer({ resolveWithObject: true })
    croppedFile = new File([data], file.name, { type: file.type })
  }

  if (resizeOptions && !resizeOptions.withoutEnlargement) {
    // When no extraction ran, `croppedFile` is the original source, so the
    // resize decodes it under the same constructor options (including a
    // stricter `limitInputPixels`) as the crop step. An encoded intermediate
    // is smaller than the source, so it keeps only the pixel limit — replaying
    // source options such as `page` onto it would be wrong. A `false` limit
    // must not override the cap, so only a numeric limit is carried over.
    const resizeSharpOptions: SharpOptions | undefined =
      croppedFile === file
        ? sharpOptions
        : typeof constructorOptions?.limitInputPixels === 'number'
          ? { limitInputPixels: constructorOptions.limitInputPixels }
          : undefined
    const sharpFile = await createSharpFromFile({
      file: croppedFile,
      maxInputPixels,
      options: resizeSharpOptions,
      sharpDependency,
    })
    const { data: resizedBuffer } = await sharpFile
      .resize({
        fit: resizeOptions.fit || 'cover',
        height: resizeOptions.height,
        position: resizeOptions.position || 'center',
        width: resizeOptions.width,
      })
      .toBuffer({ resolveWithObject: true })

    return {
      file: new File([resizedBuffer], file.name, { type: file.type }),
      status: 'continue',
    }
  }

  return {
    file: croppedFile,
    status: 'continue',
  }
}

async function transformSize({
  doc,
  file,
  options,
  req,
  sharpDependency,
}: {
  doc: Document
  file: File
  options: Extract<SharpUploadTaskOptions, { kind: 'size' }>
  req: PayloadRequest
  sharpDependency: SharpDependency
}): Promise<TransformFileResult> {
  const { canUseFocalPoint, collectionUpload, imageResizeConfig, originalDimensions } = options
  const focalPoint = canUseFocalPoint ? getSavedFocalPoint({ doc }) : undefined
  const { constructorOptions, maxInputPixels, withMetadata } = collectionUpload

  const fileIsAnimatedType = ANIMATED_MIME_TYPES.includes(file.type)
  // `constructorOptions` used to reach only the main file; a variant decodes the same
  // source, so it gets the same options (and the same input-pixel cap).
  const sharpOptions: SharpOptions = { ...constructorOptions }

  if (fileIsAnimatedType) {
    sharpOptions.animated = true
  }

  const sharpBase = (
    await createSharpFromFile({ file, maxInputPixels, options: sharpOptions, sharpDependency })
  ).rotate()
  const originalImageMeta = await sharpBase.metadata()

  let adjustedDimensions = { ...originalDimensions }

  if ([5, 6, 7, 8].includes(originalImageMeta.orientation!)) {
    adjustedDimensions = {
      height: originalDimensions.width,
      width: originalDimensions.height,
    }
  }

  let resized = sharpBase.clone()

  if (focalPoint) {
    let { height: resizeHeight, width: resizeWidth } = imageResizeConfig

    const originalAspectRatio = adjustedDimensions.width / adjustedDimensions.height

    if (resizeHeight && !resizeWidth) {
      resizeWidth = Math.round(resizeHeight * originalAspectRatio)
    }
    if (resizeWidth && !resizeHeight) {
      resizeHeight = Math.round(resizeWidth / originalAspectRatio)
    }
    if (!resizeHeight) {
      resizeHeight = originalImageMeta.height
    }
    if (!resizeWidth) {
      resizeWidth = originalImageMeta.width
    }

    const resizeAspectRatio = resizeWidth / resizeHeight
    const prioritizeHeight = resizeAspectRatio < originalAspectRatio

    resized = resized.resize({
      fastShrinkOnLoad: false,
      height: prioritizeHeight ? resizeHeight : undefined,
      width: prioritizeHeight ? undefined : resizeWidth,
    })

    const metadataAppended = await optionallyAppendMetadata({
      req,
      sharpFile: resized,
      withMetadata,
    })
    const { info } = await metadataAppended.toBuffer({ resolveWithObject: true })

    const resizedHeight = originalImageMeta.pages
      ? info.height / originalImageMeta.pages
      : info.height
    const resizedWidth = info.width

    const halfResizeX = resizeWidth / 2
    const xFocalCenter = resizedWidth * (focalPoint.x / 100)
    let leftBound = xFocalCenter - halfResizeX
    if (xFocalCenter + halfResizeX > resizedWidth) {
      leftBound = resizedWidth - resizeWidth
    }
    if (leftBound < 0) {
      leftBound = 0
    }

    const halfResizeY = resizeHeight / 2
    const yFocalCenter = resizedHeight * (focalPoint.y / 100)
    let topBound = yFocalCenter - halfResizeY
    if (yFocalCenter + halfResizeY > resizedHeight) {
      topBound = resizedHeight - resizeHeight
    }
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
    resized = resized.resize(imageResizeConfig)
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

  resized = await optionallyAppendMetadata({ req, sharpFile: resized, withMetadata })
  const { data: outputData } = await resized.toBuffer({ resolveWithObject: true })

  return {
    file: new File([outputData], file.name, { type: file.type }),
    status: 'continue',
  }
}
