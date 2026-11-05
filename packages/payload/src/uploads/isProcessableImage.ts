import { canResizeImage } from './canResizeImage.js'
import { isImage } from './isImage.js'

export function isProcessableImage(mimeType: string): boolean {
  return isImage(mimeType) || canResizeImage(mimeType)
}
