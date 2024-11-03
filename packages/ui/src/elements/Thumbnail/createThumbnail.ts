/**
 * Create a thumbnail from a File object by drawing it onto an OffscreenCanvas
 */
export const createThumbnail = (
  file: File,
  fileSrc?: string,
  mimeType?: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    /**
     * Create DOM element
     * Draw media on offscreen canvas
     * Resolve fn promise with the base64 image url
     * @param media
     * @param maxDimension
     */
    const _getBase64ImageUrl = async (
      media: HTMLImageElement | HTMLVideoElement,
      maxDimension = 280,
    ): Promise<string> => {
      return new Promise((_resolve, _reject) => {
        let drawHeight: number, drawWidth: number

        // Calculate aspect ratio
        const width = media.width || (media as HTMLVideoElement).videoWidth
        const height = media.height || (media as HTMLVideoElement).videoHeight
        const aspectRatio = width / height

        // Determine dimensions to fit within maxDimension while maintaining aspect ratio
        if (aspectRatio > 1) {
          // Image is wider than tall
          drawWidth = maxDimension
          drawHeight = maxDimension / aspectRatio
        } else {
          // Image is taller than wide, or square
          drawWidth = maxDimension * aspectRatio
          drawHeight = maxDimension
        }

        // Create an OffscreenCanvas
        const canvas = new OffscreenCanvas(drawWidth, drawHeight)
        const ctx = canvas.getContext('2d')

        // Draw the image onto the OffscreenCanvas with calculated dimensions
        ctx.drawImage(media, 0, 0, drawWidth, drawHeight)

        // Convert the OffscreenCanvas to a Blob and free up memory
        canvas
          .convertToBlob({ type: 'image/jpeg', quality: 0.25 })
          .then((blob) => {
            // Release the Object URL
            URL.revokeObjectURL(media.src)
            const reader = new FileReader()

            // Resolve as data URL
            reader.onload = () => {
              _resolve(reader.result as string)
            }
            reader.onerror = _reject
            reader.readAsDataURL(blob)
          })
          .catch(_reject)
      })
    }

    const fileType = mimeType?.split('/')?.[0]
    const url = fileSrc || URL.createObjectURL(file)
    let media: HTMLImageElement | HTMLVideoElement

    if (fileType === 'video') {
      media = document.createElement('video')
      media.src = url
      media.crossOrigin = 'anonymous'
      media.onloadeddata = () => {
        _getBase64ImageUrl(media)
          .then((url) => resolve(url))
          .catch(reject)
      }
    } else {
      media = new Image()
      media.src = url
      media.onload = () => {
        _getBase64ImageUrl(media)
          .then((url) => resolve(url))
          .catch(reject)
      }
    }

    media.onerror = (error) => {
      // Release Object URL on error
      URL.revokeObjectURL(media.src)
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject(error)
    }
  })
}
