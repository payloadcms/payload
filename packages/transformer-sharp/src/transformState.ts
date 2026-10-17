import type { ImageEncodingTransform, PayloadRequest, TransformState } from 'payload'

import { APIError } from 'payload'

import type {
  ImageUploadFormatOptions,
  SharpDependency,
  SharpTransformLimits,
  WithMetadata,
} from './types.js'

import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'
import { resolveFocalPoint } from './resolveFocalPoint.js'
import { getOutputDimensions } from './resolveResizeDimensions.js'

export const sharpTransformKeys = [
  'crop',
  'focalPoint',
  'resize',
  'rotate',
  'flip',
  'metadataPolicy',
  'encoding',
]

/** Sharp's order: normalize orientation, crop, mirror, rotate, resize, then encode. */
export async function transformState({
  buffer,
  filename,
  formatOptions,
  limits = { maxHeight: 4096, maxPixels: 16_777_216, maxWidth: 4096 },
  metadataOptions,
  mimeType,
  sharpDependency,
  shouldDeferEncoding = false,
  state,
}: {
  buffer: Buffer
  filename: string
  formatOptions?: ImageUploadFormatOptions
  limits?: SharpTransformLimits
  metadataOptions?: { req: PayloadRequest; withMetadata?: WithMetadata }
  mimeType: string
  sharpDependency: SharpDependency
  shouldDeferEncoding?: boolean
  state: TransformState
}): Promise<File> {
  const constructorOptions = {
    animated: ['image/avif', 'image/gif', 'image/webp'].includes(mimeType),
  }
  const withMetadata = resolveWithMetadata({ state, withMetadata: metadataOptions?.withMetadata })
  // A callback decides at the final boundary; keep its metadata available until then.
  const shouldPreserveMetadata = withMetadata === true || typeof withMetadata === 'function'
  const preserveMetadata = ({ image }: { image: ReturnType<SharpDependency> }) =>
    shouldPreserveMetadata ? image.withMetadata({ orientation: 1 }) : image
  // Geometry steps must not introduce another lossy encode before the final output.
  const lossless = ({ image }: { image: ReturnType<SharpDependency> }) =>
    constructorOptions.animated ? image.webp({ lossless: true }) : image.png()
  let normalized = await lossless({
    image: preserveMetadata({
      image: sharpDependency(buffer, constructorOptions).rotate(),
    }),
  }).toBuffer()

  const originalDimensions = await sharpDependency(normalized, constructorOptions).metadata()

  if (state.crop) {
    normalized = await lossless({
      image: preserveMetadata({
        image: sharpDependency(normalized, constructorOptions).extract({
          height: state.crop.height,
          left: state.crop.x,
          top: state.crop.y,
          width: state.crop.width,
        }),
      }),
    }).toBuffer()
  }

  let output = sharpDependency(normalized, constructorOptions)

  if (state.flip?.horizontal) {
    output = output.flop()
  }
  if (state.flip?.vertical) {
    output = output.flip()
  }
  if (state.rotate) {
    output = output.rotate(((state.rotate.angle % 360) + 360) % 360)
  }
  if (state.resize) {
    const dimensions =
      state.flip || state.rotate
        ? await lossless({ image: preserveMetadata({ image: output }) }).toBuffer()
        : normalized
    const metadata = await sharpDependency(dimensions, constructorOptions).metadata()
    const sourceHeight = metadata.pageHeight ?? metadata.height
    const sourceWidth = metadata.width
    const frames = metadata.pages ?? 1

    if (
      ![sourceHeight, sourceWidth, frames].every(
        (value) => Number.isSafeInteger(value) && value > 0,
      )
    ) {
      throw new APIError('Unable to determine transform dimensions.', 400)
    }
    const dimensionsToCheck = getOutputDimensions({
      fit: state.resize.fit ?? 'cover',
      height: state.resize.height,
      sourceHeight,
      sourceWidth,
      width: state.resize.width,
      withoutEnlargement: state.resize.withoutEnlargement ?? false,
    })
    const assertWithinLimits = ({ height, width }: { height: number; width: number }) => {
      if (
        ![width, height].every((value) => Number.isSafeInteger(value) && value > 0) ||
        width > limits.maxWidth ||
        height > limits.maxHeight ||
        width * height * frames > limits.maxPixels
      ) {
        throw new APIError('Requested dimensions exceed the configured maximum.', 400)
      }
    }

    if (dimensionsToCheck) {
      assertWithinLimits(dimensionsToCheck)
    }
    output = sharpDependency(dimensions, constructorOptions)
    const focalPoint = resolveFocalPoint({
      height: originalDimensions.pageHeight ?? originalDimensions.height,
      shouldApplyResize: false,
      state,
      width: originalDimensions.width,
    })

    if (
      focalPoint &&
      state.resize.width &&
      state.resize.height &&
      (state.resize.fit ?? 'cover') === 'cover'
    ) {
      const rotated = dimensions
      const frameHeight = metadata.pageHeight ?? metadata.height
      const requestedScale = Math.max(
        state.resize.width / metadata.width,
        state.resize.height / frameHeight,
      )
      const scale = state.resize.withoutEnlargement ? Math.min(requestedScale, 1) : requestedScale
      const width = Math.round(metadata.width * scale)
      const height = Math.round(frameHeight * scale)
      assertWithinLimits({ height, width })
      const resized = await lossless({
        image: preserveMetadata({
          image: sharpDependency(rotated, constructorOptions).resize({
            fit: 'fill',
            height,
            width,
          }),
        }),
      }).toBuffer()

      const cropWidth = Math.min(state.resize.width, width)
      const cropHeight = Math.min(state.resize.height, height)

      output = sharpDependency(resized, constructorOptions).extract({
        height: cropHeight,
        left: Math.max(
          0,
          Math.min(width - cropWidth, Math.floor((width * focalPoint.x) / 100 - cropWidth / 2)),
        ),
        top: Math.max(
          0,
          Math.min(height - cropHeight, Math.floor((height * focalPoint.y) / 100 - cropHeight / 2)),
        ),
        width: cropWidth,
      })
    } else {
      output = output.resize(state.resize)
    }
  }
  if (metadataOptions) {
    output = await optionallyAppendMetadata({
      metadataFormat: mimeType.slice('image/'.length) as 'jpeg',
      req: metadataOptions.req,
      sharpFile: output,
      withMetadata,
    })
  } else if (shouldPreserveMetadata) {
    output = output.withMetadata({ orientation: 1 })
  }
  const outputFormat = resolveOutputFormat({ encoding: state.encoding, formatOptions, mimeType })

  output = shouldDeferEncoding
    ? lossless({ image: output })
    : output.toFormat(
        outputFormat?.format ?? (mimeType.slice('image/'.length) as 'jpeg'),
        outputFormat?.options,
      )

  const { data, info } = await output.toBuffer({ resolveWithObject: true })

  return new File([data], filename, { type: `image/${info.format}` })
}

/** Saved encoding options override configured options; the configured format stays authoritative. */
export function resolveOutputFormat({
  encoding,
  formatOptions,
  mimeType,
}: {
  encoding?: TransformState['encoding']
  formatOptions?: ImageUploadFormatOptions
  mimeType: string
}): ImageUploadFormatOptions | undefined {
  return encoding
    ? {
        format: formatOptions?.format ?? (mimeType.slice('image/'.length) as 'jpeg'),
        options: { ...formatOptions?.options, ...(encoding as ImageEncodingTransform) },
      }
    : formatOptions
}

/** Explicit saved policy overrides the collection; omission inherits its setting. */
export function resolveWithMetadata({
  state,
  withMetadata,
}: {
  state?: null | TransformState
  withMetadata?: WithMetadata
}): undefined | WithMetadata {
  return state?.metadataPolicy ? state.metadataPolicy.mode === 'preserve' : withMetadata
}
