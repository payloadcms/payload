import {
  isVideoMimeType,
  VIDEO_FRAME_TIME,
  VIDEO_LOAD_TIMEOUT_MS,
} from '../../utilities/getVideoThumbnailSrc.js'

const maxDimension = 280

/**
 * Create a thumbnail from a File object by drawing it onto an OffscreenCanvas.
 * Videos are drawn from an early frame.
 */
export const createThumbnail = (file: File): Promise<string> => {
  if (isVideoMimeType(file.type)) {
    return createVideoThumbnail(file)
  }

  return createImageThumbnail(file)
}

function createImageThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectURL = URL.createObjectURL(file)

    img.onload = () => {
      // PNG keeps transparency and ignores quality; JPEG uses a higher quality
      const isPNG = file.type === 'image/png'

      drawToDataURL({
        outputFormat: isPNG ? 'image/png' : 'image/jpeg',
        quality: isPNG ? undefined : 0.8,
        source: img,
        sourceHeight: img.height,
        sourceWidth: img.width,
      })
        .then(resolve)
        .catch(reject)
        .finally(() => URL.revokeObjectURL(objectURL))
    }

    img.onerror = (error) => {
      URL.revokeObjectURL(objectURL)
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject(error)
    }

    img.src = objectURL
  })
}

function createVideoThumbnail(file: File): Promise<string> {
  const video = document.createElement('video')
  const objectURL = URL.createObjectURL(file)
  let timeoutID: ReturnType<typeof setTimeout> | undefined

  const frame = new Promise<string>((resolve, reject) => {
    // Some browsers never load or seek without user interaction, which would never settle
    timeoutID = setTimeout(() => {
      reject(new Error(`Timed out loading video "${file.name}" to create a thumbnail`))
    }, VIDEO_LOAD_TIMEOUT_MS)

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    video.onloadedmetadata = () => {
      // Duration is NaN or Infinity for some containers until fully buffered
      const duration = Number.isFinite(video.duration) ? video.duration : VIDEO_FRAME_TIME
      video.currentTime = Math.min(VIDEO_FRAME_TIME, duration)
    }

    video.onseeked = () => {
      drawToDataURL({
        outputFormat: 'image/jpeg',
        quality: 0.8,
        source: video,
        sourceHeight: video.videoHeight,
        sourceWidth: video.videoWidth,
      })
        .then(resolve)
        .catch(reject)
    }

    video.onerror = () => {
      reject(new Error(`Unable to load video "${file.name}" to create a thumbnail`))
    }

    video.src = objectURL
  })

  return frame.finally(() => {
    clearTimeout(timeoutID)
    video.removeAttribute('src')
    URL.revokeObjectURL(objectURL)
  })
}

/** Fit the source within `maxDimension`, keep its aspect ratio, and encode it as a data URL. */
async function drawToDataURL({
  outputFormat,
  quality,
  source,
  sourceHeight,
  sourceWidth,
}: {
  outputFormat: 'image/jpeg' | 'image/png'
  quality: number | undefined
  source: CanvasImageSource
  sourceHeight: number
  sourceWidth: number
}): Promise<string> {
  // SVGs without intrinsic dimensions report 0, which would produce a NaN ratio
  const aspectRatio = sourceHeight && sourceWidth ? sourceWidth / sourceHeight : 1
  const isLandscape = aspectRatio > 1
  const drawWidth = isLandscape ? maxDimension : maxDimension * aspectRatio
  const drawHeight = isLandscape ? maxDimension / aspectRatio : maxDimension

  const canvas = new OffscreenCanvas(drawWidth, drawHeight)
  canvas.getContext('2d')?.drawImage(source, 0, 0, drawWidth, drawHeight)

  const blob = await canvas.convertToBlob({ type: outputFormat, ...(quality && { quality }) })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unable to read thumbnail as a data URL'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read thumbnail'))
    reader.readAsDataURL(blob)
  })
}
