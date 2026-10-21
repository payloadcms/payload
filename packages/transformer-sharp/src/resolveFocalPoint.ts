import type { FocalPointTransform, TransformState } from 'payload'

/** Map an original-space point into the cropped, mirrored and rotated image. */
export function resolveFocalPoint({
  height,
  shouldApplyResize = true,
  state,
  width,
}: {
  height: number
  shouldApplyResize?: boolean
  state: TransformState
  width: number
}): FocalPointTransform | undefined {
  if (!state.focalPoint) {
    return undefined
  }

  const crop = state.crop ?? { height, width, x: 0, y: 0 }
  let x = Math.max(0, Math.min(crop.width, (width * state.focalPoint.x) / 100 - crop.x))
  let y = Math.max(0, Math.min(crop.height, (height * state.focalPoint.y) / 100 - crop.y))

  if (state.flip?.horizontal) {
    x = crop.width - x
  }
  if (state.flip?.vertical) {
    y = crop.height - y
  }

  const angle = ((state.rotate?.angle ?? 0) * Math.PI) / 180
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const rotatedWidth = Math.abs(crop.width * cosine) + Math.abs(crop.height * sine)
  const rotatedHeight = Math.abs(crop.width * sine) + Math.abs(crop.height * cosine)
  const centeredX = x - crop.width / 2
  const centeredY = y - crop.height / 2

  const point = {
    x: Math.max(
      0,
      Math.min(
        100,
        ((centeredX * cosine - centeredY * sine + rotatedWidth / 2) / rotatedWidth) * 100,
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        100,
        ((centeredX * sine + centeredY * cosine + rotatedHeight / 2) / rotatedHeight) * 100,
      ),
    ),
  }
  const resize = state.resize
  if (shouldApplyResize && resize?.width && resize.height && (resize.fit ?? 'cover') === 'cover') {
    const requestedScale = Math.max(resize.width / rotatedWidth, resize.height / rotatedHeight)
    const scale = resize.withoutEnlargement ? Math.min(requestedScale, 1) : requestedScale
    const scaledWidth = Math.round(rotatedWidth * scale)
    const scaledHeight = Math.round(rotatedHeight * scale)
    const cropWidth = Math.min(resize.width, scaledWidth)
    const cropHeight = Math.min(resize.height, scaledHeight)
    const scaledX = (scaledWidth * point.x) / 100
    const scaledY = (scaledHeight * point.y) / 100
    const left = Math.max(0, Math.min(scaledWidth - cropWidth, Math.floor(scaledX - cropWidth / 2)))
    const top = Math.max(
      0,
      Math.min(scaledHeight - cropHeight, Math.floor(scaledY - cropHeight / 2)),
    )

    return { x: ((scaledX - left) / cropWidth) * 100, y: ((scaledY - top) / cropHeight) * 100 }
  }

  return point
}
