import type { PayloadRequest, TransformFileArgs, TransformFileResult } from 'payload'
import type { ResizeOptions, SharpOptions } from 'sharp'

import type { SharpDependency, SharpUploadTaskOptions } from './types.js'

import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'
import { transformState } from './transformState.js'

const ANIMATED_MIME_TYPES = ['image/avif', 'image/gif', 'image/webp']

const percentToPixel = (value: number, dimension: number) => Math.floor((value / 100) * dimension)

async function toBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer())
}

/**
 * The Sharp package's public one-file-in/one-file-out upload primitive.
 * `options.kind` selects which legacy task to run: the main file (optionally
 * cropped, with `resizeOptions` re-applied to the crop output), or one named
 * legacy image size. Never writes to storage.
 */
export function createTransformFile({
  maxSourceBytes = 64 * 1024 * 1024,
  sharpDependency,
}: {
  maxSourceBytes?: number
  sharpDependency: SharpDependency
}) {
  return async function transformFile({
    doc,
    options,
    req,
    source,
  }: TransformFileArgs<SharpUploadTaskOptions>): Promise<TransformFileResult> {
    const state = doc._transforms
    const shouldApplySavedState =
      state && Object.keys(state).some((key) => key !== 'focalPoint') && options.kind === 'main'
    const input = source
    let file = new File(
      [Buffer.from(await input.arrayBuffer({ maxBytes: maxSourceBytes }))],
      input.filename,
      {
        type: input.mimeType,
      },
    )

    if (shouldApplySavedState) {
      file = await transformState({
        buffer: await toBuffer(file),
        filename: file.name,
        mimeType: file.type,
        sharpDependency,
        state,
      })
    }

    const metadataMode = state?.metadataPolicy?.mode
    const encoding = state?.encoding
    const formatOptions =
      options.kind === 'size'
        ? options.imageResizeConfig.formatOptions
        : options.collectionUpload.formatOptions
    const canonicalFormatOptions = encoding
      ? {
          format: formatOptions?.format ?? (file.type.slice('image/'.length) as 'jpeg'),
          options: { ...formatOptions?.options, ...encoding },
        }
      : formatOptions
    const collectionUpload = {
      ...options.collectionUpload,
      withMetadata: metadataMode
        ? metadataMode === 'preserve'
        : options.collectionUpload.withMetadata,
    }

    options =
      options.kind === 'main'
        ? {
            ...options,
            collectionUpload: { ...collectionUpload, formatOptions: canonicalFormatOptions },
          }
        : {
            ...options,
            collectionUpload,
            imageResizeConfig: {
              ...options.imageResizeConfig,
              formatOptions: canonicalFormatOptions,
            },
          }

    if (options.kind === 'main') {
      const result = await transformMain({ file, options, req, sharpDependency })

      return shouldApplySavedState && !result.file ? { file, status: 'continue' } : result
    }

    return transformSize({ file, options, req, sharpDependency })
  }
}

async function transformMain({
  file,
  options,
  req,
  sharpDependency,
}: {
  file: File
  options: Extract<SharpUploadTaskOptions, { kind: 'main' }>
  req: PayloadRequest
  sharpDependency: SharpDependency
}): Promise<TransformFileResult> {
  const { collectionUpload, crop } = options
  const { constructorOptions, formatOptions, resizeOptions, trimOptions, withMetadata } =
    collectionUpload

  const fileIsAnimatedType = ANIMATED_MIME_TYPES.includes(file.type)
  const fileHasAdjustments = Boolean(
    resizeOptions || formatOptions || trimOptions || constructorOptions,
  )

  if (crop) {
    return transformCrop({
      crop,
      file,
      fileIsAnimatedType,
      req,
      resizeOptions,
      sharpDependency,
      withMetadata,
    })
  }

  if (!fileIsAnimatedType && !fileHasAdjustments) {
    return { status: 'continue' }
  }

  const buffer = await toBuffer(file)
  const sharpOptions: SharpOptions = { ...constructorOptions }

  if (fileIsAnimatedType) {
    sharpOptions.animated = true
  }

  // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
  let sharpFile = sharpDependency(buffer, sharpOptions).rotate()

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
  const { data: outputData, info } = await sharpFile.toBuffer({ resolveWithObject: true })

  return {
    file: new File([outputData], file.name, { type: `image/${info.format}` }),
    status: 'continue',
  }
}

async function transformCrop({
  crop,
  file,
  fileIsAnimatedType,
  req,
  resizeOptions,
  sharpDependency,
  withMetadata,
}: {
  crop: NonNullable<Extract<SharpUploadTaskOptions, { kind: 'main' }>['crop']>
  file: File
  fileIsAnimatedType: boolean
  req: PayloadRequest
  resizeOptions: ResizeOptions | undefined
  sharpDependency: SharpDependency
  withMetadata: SharpUploadTaskOptions['collectionUpload']['withMetadata']
}): Promise<TransformFileResult> {
  const { cropData, heightInPixels, originalDimensions, widthInPixels } = crop
  const buffer = await toBuffer(file)

  const sharpOptions: SharpOptions = fileIsAnimatedType ? { animated: true } : {}

  const newWidth = Number(widthInPixels)
  const newHeight = Number(heightInPixels)
  const dimensionsChanged =
    originalDimensions.width !== newWidth || originalDimensions.height !== newHeight

  let croppedBuffer: Buffer

  if (!dimensionsChanged) {
    croppedBuffer = buffer
  } else {
    const formattedCropData = {
      height: newHeight,
      left: percentToPixel(cropData.x, originalDimensions.width),
      top: percentToPixel(cropData.y, originalDimensions.height),
      width: newWidth,
    }

    let cropped = sharpDependency(buffer, sharpOptions).extract(formattedCropData)
    cropped = await optionallyAppendMetadata({ req, sharpFile: cropped, withMetadata })
    const { data } = await cropped.toBuffer({ resolveWithObject: true })
    croppedBuffer = data
  }

  if (resizeOptions && !resizeOptions.withoutEnlargement) {
    const { data: resizedBuffer } = await sharpDependency(croppedBuffer)
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
    file: new File([croppedBuffer], file.name, { type: file.type }),
    status: 'continue',
  }
}

async function transformSize({
  file,
  options,
  req,
  sharpDependency,
}: {
  file: File
  options: Extract<SharpUploadTaskOptions, { kind: 'size' }>
  req: PayloadRequest
  sharpDependency: SharpDependency
}): Promise<TransformFileResult> {
  const { collectionUpload, focalPoint, imageResizeConfig, originalDimensions } = options
  const { withMetadata } = collectionUpload

  const fileIsAnimatedType = ANIMATED_MIME_TYPES.includes(file.type)
  const buffer = await toBuffer(file)
  const sharpOptions: SharpOptions = fileIsAnimatedType ? { animated: true } : {}

  const sharpBase = sharpDependency(buffer, sharpOptions).rotate()
  const originalImageMeta = await sharpBase.metadata()

  const adjustedDimensions = originalDimensions

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
      resizeHeight = adjustedDimensions.height
    }
    if (!resizeWidth) {
      resizeWidth = adjustedDimensions.width
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
  const { data: outputData, info } = await resized.toBuffer({ resolveWithObject: true })

  return {
    file: new File([outputData], file.name, { type: `image/${info.format}` }),
    status: 'continue',
  }
}
