import type { ImageEncodingTransform, TransformState } from 'payload'

import type { SharpDependency } from './types.js'

import { resolveFocalPoint } from './resolveFocalPoint.js'

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
  mimeType,
  sharpDependency,
  state,
}: {
  buffer: Buffer
  filename: string
  mimeType: string
  sharpDependency: SharpDependency
  state: TransformState
}): Promise<File> {
  const constructorOptions = {
    animated: ['image/avif', 'image/gif', 'image/webp'].includes(mimeType),
  }
  const shouldPreserveMetadata = state.metadataPolicy?.mode === 'preserve'
  const preserveMetadata = ({ image }: { image: ReturnType<SharpDependency> }) =>
    shouldPreserveMetadata ? image.withMetadata({ orientation: 1 }) : image
  let normalized = await preserveMetadata({
    image: sharpDependency(buffer, constructorOptions).rotate(),
  }).toBuffer()

  const originalDimensions = await sharpDependency(normalized, constructorOptions).metadata()

  if (state.crop) {
    normalized = await preserveMetadata({
      image: sharpDependency(normalized, constructorOptions).extract({
        height: state.crop.height,
        left: state.crop.x,
        top: state.crop.y,
        width: state.crop.width,
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
    const focalPoint = resolveFocalPoint({
      height: originalDimensions.height,
      state,
      width: originalDimensions.width,
    })

    if (
      focalPoint &&
      state.resize.width &&
      state.resize.height &&
      (state.resize.fit ?? 'cover') === 'cover'
    ) {
      const rotated = await preserveMetadata({ image: output }).toBuffer()
      const dimensions = await sharpDependency(rotated, constructorOptions).metadata()
      const requestedScale = Math.max(
        state.resize.width / dimensions.width,
        state.resize.height / dimensions.height,
      )
      const scale = state.resize.withoutEnlargement ? Math.min(requestedScale, 1) : requestedScale
      const width = Math.round(dimensions.width * scale)
      const height = Math.round(dimensions.height * scale)
      const resized = await preserveMetadata({
        image: sharpDependency(rotated, constructorOptions).resize({ fit: 'fill', height, width }),
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
  if (state.metadataPolicy?.mode === 'preserve') {
    output = output.withMetadata({ orientation: 1 })
  }
  if (state.encoding) {
    const format = mimeType.slice('image/'.length)

    output = output.toFormat(
      format as 'avif' | 'gif' | 'jpeg' | 'png' | 'tiff' | 'webp',
      state.encoding as ImageEncodingTransform,
    )
  }

  const { data, info } = await output.toBuffer({ resolveWithObject: true })

  return new File([data], filename, { type: `image/${info.format}` })
}
