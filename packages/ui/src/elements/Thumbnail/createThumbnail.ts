/**
 * Create a thumbnail from a File object by drawing it onto an OffscreenCanvas
 */
export const createThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file) // Use Object URL directly

    img.onload = () => {
      const canvasSize = 24
      const canvas = new OffscreenCanvas(canvasSize, canvasSize) // Create an OffscreenCanvas
      const ctx = canvas.getContext('2d')

      // Calculate aspect ratio
      const aspectRatio = img.width / img.height
      let drawHeight: number, drawWidth: number, offsetX: number, offsetY: number

      // Determine dimensions to fill the canvas while maintaining aspect ratio
      if (aspectRatio > 1) {
        // Image is wider than tall
        drawWidth = canvasSize
        drawHeight = canvasSize / aspectRatio
        offsetX = 0
        offsetY = (canvasSize - drawHeight) / 2
      } else {
        // Image is taller than wide, or square
        drawWidth = canvasSize * aspectRatio
        drawHeight = canvasSize
        offsetX = (canvasSize - drawWidth) / 2
        offsetY = 0
      }

      // Draw the image onto the OffscreenCanvas with calculated dimensions and offsets
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

      // Convert the OffscreenCanvas to a Blob and free up memory
      canvas
        .convertToBlob({ type: 'image/jpg', quality: 0.25 })
        .then((blob) => {
          URL.revokeObjectURL(img.src) // Release the Object URL
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string) // Resolve as data URL
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        .catch(reject)
    }

    img.onerror = (error) => {
      URL.revokeObjectURL(img.src) // Release Object URL on error
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject(error)
    }
  })
}
